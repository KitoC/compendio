import { useRealtimeAiAgent } from "@/contexts/RealtimeAIAgent/RealtimAiAgentContext";
import { cn } from "@/lib/utils";
import SpeakingAnimation from "./SpeakingAnimation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MessageCircle } from "lucide-react";

const FloatingButton = ({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "transition-all opacity-0 hover:scale-110 !hover:bg-slate-300 duration-200 !bg-white border !border-border shadow-lg text-gray-800 p-1.5 rounded-full h-[40px] w-[40px] flex items-center justify-center z-100",
        className
      )}
    >
      {children}
    </Button>
  );
};

export const AssistantAvatar = ({ toggleOpen, isOpen }) => {
  const {
    startListening,
    stopListening,
    isListening,
    isConnecting,
    assistantTalking,
  } = useRealtimeAiAgent();

  const [blinking, setBlinking] = useState(false);

  const activeColor = isListening
    ? "bg-primary hover:bg-primary/80"
    : "bg-slate-400 hover:bg-slate-500";

  // Random blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 300);
    }, Math.random() * 4000 + 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const eyeStyles = cn(
    "w-4 h-5 rounded-full transition-all duration-200",
    activeColor,
    !isListening && "h-0.5",
    !isListening && isConnecting && blinking && "h-1",
    isListening && blinking && "h-1"
  );

  return (
    <div className="pointer-events-auto relative group flex items-end gap-1">
      {!isOpen && (
        <div className="flex items-center justify-center gap-1">
          <FloatingButton
            onClick={isListening ? stopListening : startListening}
            className={isListening ? "opacity-100 -left-[30px]" : "opacity-0"}
          >
            <Mic className="h-2 w-2" />
          </FloatingButton>
          <FloatingButton
            onClick={toggleOpen}
            className={isListening ? "opacity-100 -left-[70px]" : "opacity-0"}
          >
            <MessageCircle className="h-2 w-2" />
          </FloatingButton>
        </div>
      )}
      <Button
        onClick={isListening ? stopListening : startListening}
        className={cn(
          "bg-slate-400 hover:bg-slate-500 shadow-lg text-gray-800 p-1.5 rounded-full h-[80px] w-[80px] flex items-center justify-center relative z-100",
          activeColor,
          isConnecting && "animate-pulse"
        )}
      >
        <div
          className={cn(
            "bg-white rounded-full h-full w-full relative flex items-center justify-center z-10 relative",
            isConnecting && "animate-pulse"
          )}
        >
          <div className="absolute -top-1.5 left-0 w-full h-full flex items-center justify-between p-2">
            <div className={eyeStyles} />
            <div className={eyeStyles} />
          </div>
          {assistantTalking ? (
            <SpeakingAnimation
              className="scale-[0.2] relative top-4"
              barClassName="bg-primary"
            />
          ) : (
            <div
              className={cn(
                "w-4 h-1 bg-primary rounded-full top-4 relative",
                activeColor
              )}
            />
            //   <Bot className="h-10 w-10 text-slate-600" />
          )}
        </div>
      </Button>
    </div>
  );
};
