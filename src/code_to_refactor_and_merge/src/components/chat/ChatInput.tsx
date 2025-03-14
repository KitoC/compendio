import { forwardRef, useState, useEffect, KeyboardEvent } from "react";
import { CHAT_COMMANDS } from "../../constants/commands";
import CommandSuggestions from "./CommandSuggestions";
import { IconButton } from "../common/Button";
import styled from "styled-components";
import AutoExpandingTextArea from "../common/form/AutoExpandingTextArea";
import { RiChatVoiceAiFill } from "react-icons/ri";
import { RiSendPlaneFill } from "react-icons/ri";
import { RiCloseFill } from "react-icons/ri";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const FormContainer = styled.form``;

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem; /* gap-2 */
  line-height: 1.5;
  align-items: flex-end;
`;

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

    const filteredCommands = CHAT_COMMANDS.filter((cmd) =>
      cmd.command.toLowerCase().includes(commandFilter.toLowerCase())
    );

    const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition,
      ...rest
    } = useSpeechRecognition();

    useEffect(() => {
      if (message.startsWith("/")) {
        setShowCommands(true);
        setCommandFilter(message.slice(1));
        setSelectedCommandIndex(0);
      } else {
        setShowCommands(false);
      }
    }, [message]);

    const handleSpeachToText = () => {
      if (listening) {
        SpeechRecognition.stopListening();
      } else {
        SpeechRecognition.startListening();
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (browserSupportsSpeechRecognition) {
        handleSpeachToText();
      }

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
      <FormContainer
        onSubmit={handleSubmit}
        className="bg-white dark:border-none border border-slate-100 dark:bg-gray-700 rounded-lg shadow-sm p-3"
      >
        {showCommands && (
          <CommandSuggestions
            commands={CHAT_COMMANDS}
            onSelect={handleCommandSelect}
            filter={commandFilter}
            selectedIndex={selectedCommandIndex}
          />
        )}
        <InputContainer>
          <AutoExpandingTextArea
            ref={ref}
            value={message || transcript}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            maxRows={5}
          />

          <IconButton
            icon={
              !message.length && browserSupportsSpeechRecognition ? (
                listening ? (
                  <RiCloseFill />
                ) : (
                  <RiChatVoiceAiFill />
                )
              ) : (
                <RiSendPlaneFill />
              )
            }
            externalIcon
            type="submit"
            variant="primary"
            size="lg"
          >
            Send
          </IconButton>
        </InputContainer>
        {/* <div className="flex justify-end">
          <IconButton
            icon={!message.length ? <RiChatVoiceAiFill /> : <RiSendPlaneFill />}
            externalIcon
            type="submit"
            variant="primary"
            size="lg"
          >
            Send
          </IconButton>
        </div> */}
      </FormContainer>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
