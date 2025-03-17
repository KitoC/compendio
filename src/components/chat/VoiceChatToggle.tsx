
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useEffect } from "react";
import { toast } from "sonner";

interface VoiceChatToggleProps {
  agentId?: string;
  onMessageReceived?: (message: string) => void;
}

/**
 * A simple toggle button component for voice chat functionality
 * This is just an example of how to use the useVoiceChat hook
 */
const VoiceChatToggle = ({ agentId, onMessageReceived }: VoiceChatToggleProps) => {
  const {
    isListening,
    isAgentSpeaking,
    toggle,
    lastMessage,
    errorMessage,
    clearError
  } = useVoiceChat({
    agentId,
    onMessageReceived
  });

  // Show error toast if there's an error
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      clearError();
    }
  }, [errorMessage, clearError]);

  return (
    <div className="flex items-center gap-2">
      {isAgentSpeaking && (
        <div className="flex items-center text-primary">
          <Volume2 className="h-4 w-4 animate-pulse mr-1" />
          <span className="text-xs">Speaking...</span>
        </div>
      )}
      
      <IconButton
        onClick={toggle}
        variant={isListening ? "destructive" : "primary"}
        size="sm"
        className="rounded-full"
        icon={
          isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )
        }
        aria-label={isListening ? "Stop voice chat" : "Start voice chat"}
        title={isListening ? "Stop voice chat" : "Start voice chat"}
      />
    </div>
  );
};

export default VoiceChatToggle;
