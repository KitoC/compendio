
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

interface ChatInputProps {
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ className }) => {
  const {
    input,
    setInput,
    sendMessage,
    isListening,
    toggleVoiceMode,
  } = useChat();
  const { startListening, stopListening } = useVoice();

  React.useEffect(() => {
    if (isListening) {
      startListening();
    } else {
      stopListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleVoiceMode(true); // Pass the argument
    }
  };

  return (
    <div className={cn("relative rounded-md border", className)}>
      <Input
        type="text"
        placeholder="Type your message here"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pr-12"
      />
      <div className="absolute right-2.5 top-2.5 flex items-center space-x-1">
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "rounded-full text-muted-foreground hover:bg-background-hover hover:text-primary",
            isListening && "bg-primary/10 text-primary"
          )}
          onClick={() => toggleVoiceMode(!isListening)}
          title="Voice mode"
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="submit"
          onClick={sendMessage}
          title="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
};
