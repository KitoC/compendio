// NO_CHANGE
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/contexts/chat/useChat";

interface VoiceChatToggleProps {
  agentId?: string;
  onMessageReceived?: (message: string) => void;
  voiceConfig?: {
    languageCode?: string;
    name?: string;
    ssmlGender?: string;
  };
  conversationId?: string;
}

const useVoiceToggle = ({
  agentId,
  voiceConfig = {
    languageCode: "en-US",
    name: "en-US-Standard-C",
    ssmlGender: "FEMALE",
  },
  conversationId,
}: VoiceChatToggleProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const { tenantId } = useAuth();
  const { handleHumanVoiceMessage, handleAgentVoiceMessage } = useChat();

  const { isAgentSpeaking, errorMessage, clearError, sendMessageToAgent } =
    useVoiceChat({
      agentId,
      onMessageReceived: (message, functionCall) => {
        handleAgentVoiceMessage(message.trim(), functionCall);
      },
      voiceConfig,
      conversationId,
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
        callback: (text) => {
          // Only process if this is a new transcript
          if (text && text !== lastFinalTranscript) {
            setLastFinalTranscript(text);
            handleHumanVoiceMessage(text);
            // Send message to agent when speech is finished
            sendMessageToAgent({
              id: uuidv4(),
              conversation_id: conversationId,
              role: "user",
              content: { text },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {},
              tenant_id: tenantId,
            });
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
