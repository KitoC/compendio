// NO_CHANGE

import { forwardRef, useState, KeyboardEvent, useEffect, useRef } from "react";
import {
  AudioLines,
  Mic,
  MicOff,
  SendHorizontal,
  X,
  Activity,
  StopCircle,
} from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { CHAT_COMMANDS } from "@/lib/chat-commands";
import { CommandSuggestions } from "./CommandSuggestions";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import clsx from "clsx";
import { useTTS } from "@/contexts/TTSProvider";
import { useVoiceContext } from "@/contexts/VoiceProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useElementSize } from "@/hooks/useElementSize";
import { useChat } from "@/contexts/chat";
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  agentId?: string;
  conversationId?: string;
}

const AudioVisualizer = ({
  isAgentSpeaking,
  listening,
}: {
  listening: boolean;
  isAgentSpeaking: boolean;
}) => {
  return (
    <div
      className={clsx(
        "w-14 h-14 rounded-full bg-primary flex items-center justify-center",
        {
          "voice-listening": listening,
          "agent-talking": isAgentSpeaking,
        }
      )}
    >
      {isAgentSpeaking && (
        <div className="absolute  bg-primary h-2/3 w-2/3 rounded-full z-[-1] animate-ping" />
      )}

      {!isAgentSpeaking && <AudioLines className={clsx({})} />}
      {isAgentSpeaking && <Activity className="" />}
    </div>
  );
};
const buttonWrapperClass =
  "bg-white dark:bg-gray-700 rounded-full p-2 border border-gray-200 dark:border-slate-600 border-b-0 rounded-b-none border-r-0 border-l-0";

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, disabled, agentId, conversationId }, ref) => {
    const formRef = useRef<HTMLFormElement>(null);
    const { interruptAiAgent, isTyping } = useChat();
    const [message, setMessage] = useState("");
    const [showCommands, setShowCommands] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [commandFilter, setCommandFilter] = useState("");
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const isMobile = useIsMobile();
    const bufferRef = useRef<HTMLDivElement>(null);
    useViewportHeight();
    useElementSize(formRef as React.RefObject<HTMLFormElement>, (size) => {
      document.documentElement.style.setProperty(
        "--page-bottom-padding",
        `${size.height}px`
      );
    });

    const handleFocus = () => {
      // Helps on iOS Safari and Android Chrome
      setTimeout(() => {
        (ref as React.RefObject<HTMLTextAreaElement>)?.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    };

    const filteredCommands = CHAT_COMMANDS.filter((cmd) =>
      cmd.command.toLowerCase().includes(commandFilter.toLowerCase())
    );
    const { isPlaying } = useTTS();
    const {
      startListening,
      stopListening,
      transcript,
      isListening,
      toggleMute,
      isMuted,
    } = useVoiceContext();

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
        setIsVoiceMode(true);
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

    const showStopButton = isTyping || isPlaying;

    useEffect(() => {
      if (!isMobile) return;

      const inputContainer = formRef?.current;

      if (!inputContainer) return;

      const handleViewport = () => {
        const offset = window.innerHeight - window.visualViewport?.height;
        inputContainer.style.transform =
          offset > 0 ? `translateY(-${offset}px)` : "";

        if (bufferRef.current) {
          bufferRef.current.style.transform =
            offset > 0 ? `translateY(-${offset}px)` : "";
        }
      };

      window.visualViewport?.addEventListener("resize", handleViewport);
      window.visualViewport?.addEventListener("scroll", handleViewport);

      return () => {
        window.visualViewport?.removeEventListener("resize", handleViewport);
        window.visualViewport?.removeEventListener("scroll", handleViewport);
      };
    }, [isMobile]);

    return (
      <>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={clsx(
            "bg-white dark:bg-gray-700 border border-gray-200 dark:border-slate-600 rounded-lg p-3 transition-all duration-300 ",
            {
              "rounded-b-none border-none pb-6 shadow-[0_0_10px_0_rgba(0,0,0,0.2)]":
                isMobile,
            }
          )}
        >
          {showCommands && (
            <CommandSuggestions
              commands={CHAT_COMMANDS}
              onSelect={handleCommandSelect}
              filter={commandFilter}
              selectedIndex={selectedCommandIndex}
            />
          )}
          <div
            className={clsx(
              "flex gap-2 items-end transition-all duration-300 relative",
              isVoiceMode && "justify-center"
            )}
          >
            {!isVoiceMode && (
              <textarea
                ref={ref as React.RefObject<HTMLTextAreaElement>}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={disabled}
                className="flex-1 resize-none min-h-[40px] max-h-[120px] py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent border-none"
                rows={1}
                style={{
                  height: "auto",
                  overflowY: "hidden",
                  // Fix the TypeScript error by properly typing the CSS variable
                  ["--tw-ring-color" as string]: "transparent",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(
                    target.scrollHeight,
                    120
                  )}px`;
                }}
                onFocus={handleFocus}
              />
            )}

            {isVoiceMode && (
              <div
                className={clsx("flex items-center flex-col gap-2", {
                  "top-[-40px] relative ": isVoiceMode,
                })}
              >
                <div className="flex items-center gap-2">
                  <div className={buttonWrapperClass}>
                    <IconButton
                      onClick={toggleMute}
                      variant={!isMuted ? "secondary" : "destructive"}
                      size="sm"
                      className="rounded-full h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                      icon={
                        !isMuted ? (
                          <Mic className="h-5 w-5" />
                        ) : (
                          <MicOff className="h-5 w-5" />
                        )
                      }
                      aria-label={
                        !isMuted ? "Mute microphone" : "Unmute microphone"
                      }
                      title={!isMuted ? "Mute microphone" : "Unmute microphone"}
                    />
                  </div>
                  <div className={buttonWrapperClass}>
                    <AudioVisualizer
                      listening={isListening}
                      isAgentSpeaking={isPlaying}
                    />
                  </div>
                  <div className={buttonWrapperClass}>
                    <IconButton
                      onClick={(e) => {
                        setIsVoiceMode(false);
                        stopListening();
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={disabled}
                      className="h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                      icon={<X className="h-5 w-5" />}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{transcript}</p>
              </div>
            )}
            {!isVoiceMode && showStopButton && (
              <IconButton
                onClick={interruptAiAgent}
                icon={<StopCircle className="h-5 w-5" />}
              />
            )}
            {!showStopButton && (
              <>
                {!isVoiceMode && message.length === 0 && (
                  <IconButton
                    onClick={(e) => {
                      setIsVoiceMode(true);
                      startListening();
                    }}
                    type={isVoiceMode ? "button" : "submit"}
                    variant="primary"
                    size="lg"
                    disabled={disabled}
                    className="h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                    icon={<AudioLines className="h-5 w-5" />}
                  />
                )}

                {!isVoiceMode && message.length > 0 && (
                  <IconButton
                    onClick={(e) => {
                      if (message.length > 0) {
                        handleSubmit(e);
                        return;
                      }
                    }}
                    type={isVoiceMode ? "button" : "submit"}
                    variant="primary"
                    size="lg"
                    disabled={disabled}
                    className="h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                    icon={<SendHorizontal className="h-5 w-5 -rotate-90" />}
                  />
                )}
              </>
            )}
          </div>
        </form>
        {isMobile && (
          <div
            ref={bufferRef}
            className="h-[300px] absolute bottom-[-300px] left-0 right-0 bg-white dark:bg-gray-700 transition-all duration-300"
          ></div>
        )}
      </>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
