
import { forwardRef, useState, KeyboardEvent, useEffect } from "react";
import { SendHorizontal, X, AudioLines } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { CHAT_COMMANDS } from "@/lib/chat-commands";
import { CommandSuggestions } from "./CommandSuggestions";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, disabled }, ref) => {
    const [message, setMessage] = useState("");
    const [showCommands, setShowCommands] = useState(false);
    const [commandFilter, setCommandFilter] = useState("");
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const filteredCommands = CHAT_COMMANDS.filter((cmd) =>
      cmd.command.toLowerCase().includes(commandFilter.toLowerCase())
    );

    useEffect(() => {
      if (message.startsWith("/")) {
        setShowCommands(true);
        setCommandFilter(message.slice(1));
        setSelectedCommandIndex(0);
      } else {
        setShowCommands(false);
      }
    }, [message]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim() || disabled) {
        return;
      }

      onSendMessage(message.trim());
      setMessage("");
      setShowCommands(false);
    };

    const handleCommandSelect = (command: string) => {
      onSendMessage(`/${command}`);
      setMessage("");
      setShowCommands(false);
      setSelectedCommandIndex(0);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "Enter":
          if (!e.shiftKey) {
            handleSubmit(e);
          }

          if (showCommands && filteredCommands[selectedCommandIndex]) {
            e.preventDefault();
            handleCommandSelect(filteredCommands[selectedCommandIndex].command);
          }
          break;
        case "Escape":
          setShowCommands(false);
          break;
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-none rounded-lg shadow-sm p-3"
      >
        {showCommands && (
          <CommandSuggestions
            commands={CHAT_COMMANDS}
            onSelect={handleCommandSelect}
            filter={commandFilter}
            selectedIndex={selectedCommandIndex}
          />
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="flex-1 resize-none min-h-[40px] max-h-[120px] py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent border-none"
            rows={1}
            style={{
              height: "auto",
              overflowY: "hidden",
              // Fix the TypeScript error by properly typing the CSS variable
              ["--tw-ring-color" as string]: "transparent"
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />

          <IconButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={disabled}
            icon={
              !message.length ? (
                <AudioLines className="h-5 w-5" /> // TODO: Add voice input functionality
              ) : (
                <SendHorizontal className="h-5 w-5 -rotate-90" />
              )
            }
          />
        </div>
      </form>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
