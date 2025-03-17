import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface VoiceChatToggleProps {
  agentId?: string;
  onMessageReceived?: (message: string) => void;
  voiceConfig?: {
    languageCode?: string;
    name?: string;
    ssmlGender?: string;
  };
}

const useVoiceToggle = (
  agentId,
  onMessageReceived,
  voiceConfig = {
    languageCode: "en-US",
    name: "en-US-Standard-C",
    ssmlGender: "FEMALE",
  }
) => {
  const [isMuted, setIsMuted] = useState(false);
  const { isAgentSpeaking, errorMessage, clearError, sendMessageToAgent } =
    useVoiceChat({
      agentId,
      onMessageReceived,
      voiceConfig,
    });

  const [lastFinalTranscript, setLastFinalTranscript] = useState("");

  // Using React Speech Recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    ...rest
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands: [
      {
        command: "*",
        callback: (command) => {
          // Only process if this is a new transcript
          if (command && command !== lastFinalTranscript) {
            setLastFinalTranscript(command);
            // Send message to agent when speech is finished
            sendMessageToAgent(command);
          }
        },
        matchInterim: false,
      },
    ],
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

  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();

    if (listening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      try {
        await SpeechRecognition.startListening({
          continuous: true,
          language: voiceConfig.languageCode,
        });
      } catch (error) {
        toast.error(
          "Failed to start voice recognition. Please check microphone permissions."
        );
      }
    }
  };
  const startListening = async () => {
    try {
      await SpeechRecognition.startListening({
        continuous: true,
        language: voiceConfig.languageCode,
      });
    } catch (error) {
      toast.error(
        "Failed to start voice recognition. Please check microphone permissions."
      );
    }
  };

  const closeVoiceMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    SpeechRecognition.stopListening();
    resetTranscript();
  };

  const toggleMute = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const nextIsMuted = !isMuted;
    setIsMuted(nextIsMuted);

    if (nextIsMuted) {
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      await SpeechRecognition.startListening({
        continuous: true,
        language: voiceConfig.languageCode,
      });
    }
  };

  return {
    isAgentSpeaking,
    listening,
    transcript,
    toggle,
    closeVoiceMode,
    toggleMute,
    isMuted,
    startListening,
  };
};

export default useVoiceToggle;
