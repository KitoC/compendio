
import React, { useState } from "react";
import { MessageCircle, X, Expand, Minimize, ArrowLeftFromLine } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import { ChatProvider } from "@/contexts/chat";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "left" | "right";

interface ChatWidgetProps {
  position?: Position;
  defaultOpen?: boolean;
  defaultFullScreen?: boolean;
  conversationId?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  position = "bottom-right",
  defaultOpen = false,
  defaultFullScreen = false,
  conversationId = uuidv4(),
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isFullScreen, setIsFullScreen] = useState(defaultFullScreen);
  
  const toggleChatOpen = () => setIsOpen(!isOpen);
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const handleClose = (e: React.MouseEvent) => {
    if (isFullScreen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };
  
  const getPositionStyles = () => {
    const baseStyles = "fixed transition-all duration-300 ease-out";
    
    if (!isOpen) {
      return `${baseStyles} ${getButtonPosition()}`;
    }
    
    if (isFullScreen) {
      return `${baseStyles} top-4 left-4 right-4 bottom-4 max-w-6xl mx-auto`;
    }
    
    switch (position) {
      case "bottom-right":
        return `${baseStyles} bottom-4 right-4`;
      case "bottom-left":
        return `${baseStyles} bottom-4 left-4`;
      case "top-right":
        return `${baseStyles} top-4 right-4`;
      case "top-left":
        return `${baseStyles} top-4 left-4`;
      case "left":
        return `${baseStyles} left-4 top-1/2 -translate-y-1/2`;
      case "right":
        return `${baseStyles} right-4 top-1/2 -translate-y-1/2`;
      default:
        return `${baseStyles} bottom-4 right-4`;
    }
  };
  
  const getButtonPosition = () => {
    switch (position) {
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "left":
        return "left-4 top-1/2 -translate-y-1/2";
      case "right":
        return "right-4 top-1/2 -translate-y-1/2";
      default:
        return "bottom-4 right-4";
    }
  };
  
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/20 transition-opacity duration-300 z-50",
        isFullScreen && isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={handleClose}
    >
      <div 
        className={cn(
          getPositionStyles(),
          isOpen 
            ? "bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            : "bg-transparent border-none w-14 h-14"
        )}
        style={{
          width: isOpen ? (isFullScreen ? "100%" : "400px") : "56px",
          height: isOpen ? (isFullScreen ? "100%" : "600px") : "56px",
          maxHeight: isOpen ? (isFullScreen ? "100%" : "600px") : "56px",
          maxWidth: isOpen ? (isFullScreen ? "72rem" : "400px") : "56px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen ? (
          <ChatProvider conversationId={conversationId}>
            <div className="flex justify-between items-center p-2 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Chat Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullScreen}
                  icon={isFullScreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleChatOpen}
                  icon={<X className="w-4 h-4" />}
                />
              </div>
            </div>
            <ChatMessages />
            <ChatFooter />
          </ChatProvider>
        ) : (
          <IconButton
            variant="primary"
            size="lg"
            className="w-full h-full"
            onClick={toggleChatOpen}
            icon={<MessageCircle className="w-6 h-6" />}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
