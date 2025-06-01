import React, { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import { Button } from "@/components/ui/button";
interface ChatInputProps {
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const ChatInput = ({
  placeholder = "How can I assist you?",
  onKeyDown,
}: ChatInputProps) => {
  const { sendMessage } = useRealtimeAiAgent();
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      sendMessage(value);
      setValue("");
    }
  }, [sendMessage, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
      if (onKeyDown) {
        onKeyDown(event);
      }
    },
    [handleSubmit, onKeyDown]
  );

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className="relative w-full -mb-1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        className="
          w-full min-h-[40px] max-h-[120px] p-3 pr-12
          border border-stone-300 rounded-lg
          font-inherit text-sm leading-tight
          resize-none overflow-y-auto outline-none
          transition-colors duration-200
          focus:border-stone-500 focus:ring-3 focus:ring-stone-500/10
          placeholder:text-stone-400
        "
      />
      <Button
        disabled={value.trim().length === 0}
        onClick={handleSubmit}
        className="
          absolute right-1.5 bottom-2.5
          h-8 w-8
          bg-stone-600 hover:bg-stone-700
          disabled:bg-stone-600 disabled:text-stone-400
          text-lime-600 hover:text-lime-700
          border-none
          flex items-center justify-center
          transition-colors duration-200
        "
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatInput;
