
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface VoiceChatToggleProps {
  agentId?: string;
  onMessageReceived?: (message: string) => void;
  voiceConfig?: {
    languageCode?: string;
    name?: string;
    ssmlGender?: string;
  };
}

/**
 * A toggle button component for voice chat functionality using React Speech Recognition
 * 
 * Usage:
 * ```
 * <VoiceChatToggle 
 *   agentId="your-agent-id" 
 *   onMessageReceived={(msg) => console.log(msg)}
 *   voiceConfig={{
 *     languageCode: "en-US",
 *     name: "en-US-Standard-C",
 *     ssmlGender: "FEMALE"
 *   }}
 * />
 * ```
 */
const VoiceChatToggle = ({ 
  agentId, 
  onMessageReceived,
  voiceConfig = {
    languageCode: "en-US",
    name: "en-US-Standard-C",
    ssmlGender: "FEMALE"
  }
}: VoiceChatToggleProps) => {
  const {
    isAgentSpeaking,
    errorMessage,
    clearError,
    sendMessageToAgent
  } = useVoiceChat({
    agentId,
    onMessageReceived,
    voiceConfig
  });

  const [lastFinalTranscript, setLastFinalTranscript] = useState("");

  // Using React Speech Recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands: [
      {
        command: '*',
        callback: (command) => {
          // Only process if this is a new transcript
          if (command && command !== lastFinalTranscript) {
            setLastFinalTranscript(command);
            // Send message to agent when speech is finished
            sendMessageToAgent(command);
          }
        },
        matchInterim: false
      }
    ]
  });

  // Check browser support
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Your browser doesn't support speech recognition.");
    } else if (!isMicrophoneAvailable) {
      toast.error("Microphone access is needed for voice chat.");
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  // Show error toast if there's an error
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      clearError();
    }
  }, [errorMessage, clearError]);

  const toggle = async () => {
    if (listening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      try {
        await SpeechRecognition.startListening({ continuous: true, language: voiceConfig.languageCode });
      } catch (error) {
        toast.error("Failed to start voice recognition. Please check microphone permissions.");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isAgentSpeaking && (
        <div className="flex items-center text-primary">
          <Volume2 className="h-4 w-4 animate-pulse mr-1" />
          <span className="text-xs">Speaking...</span>
        </div>
      )}
      
      {listening && transcript && (
        <div className="text-xs text-muted-foreground max-w-[150px] truncate">
          {transcript}
        </div>
      )}
      
      <IconButton
        onClick={toggle}
        variant={listening ? "destructive" : "primary"}
        size="sm"
        className="rounded-full"
        icon={
          listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )
        }
        aria-label={listening ? "Stop voice chat" : "Start voice chat"}
        title={listening ? "Stop voice chat" : "Start voice chat"}
      />
    </div>
  );
};

export default VoiceChatToggle;
