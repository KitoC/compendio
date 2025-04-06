
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
      return `${baseStyles} top-4 left-4 right-4 bottom-4 max-w-6xl mx-auto pt-safe-top pb-safe-bottom`;
    }
    
    switch (position) {
      case "bottom-right":
        return `${baseStyles} bottom-4 right-4 mb-safe-bottom mr-safe-right`;
      case "bottom-left":
        return `${baseStyles} bottom-4 left-4 mb-safe-bottom ml-safe-left`;
      case "top-right":
        return `${baseStyles} top-4 right-4 mt-safe-top mr-safe-right`;
      case "top-left":
        return `${baseStyles} top-4 left-4 mt-safe-top ml-safe-left`;
      case "left":
        return `${baseStyles} left-4 top-1/2 -translate-y-1/2 ml-safe-left`;
      case "right":
        return `${baseStyles} right-4 top-1/2 -translate-y-1/2 mr-safe-right`;
      default:
        return `${baseStyles} bottom-4 right-4 mb-safe-bottom mr-safe-right`;
    }
  };
  
  const getButtonPosition = () => {
    switch (position) {
      case "bottom-right":
        return "bottom-4 right-4 mb-safe-bottom mr-safe-right";
      case "bottom-left":
        return "bottom-4 left-4 mb-safe-bottom ml-safe-left";
      case "top-right":
        return "top-4 right-4 mt-safe-top mr-safe-right";
      case "top-left":
        return "top-4 left-4 mt-safe-top ml-safe-left";
      case "left":
        return "left-4 top-1/2 -translate-y-1/2 ml-safe-left";
      case "right":
        return "right-4 top-1/2 -translate-y-1/2 mr-safe-right";
      default:
        return "bottom-4 right-4 mb-safe-bottom mr-safe-right";
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
            : "bg-transparent border-none w-16 h-16"
        )}
        style={{
          width: isOpen ? (isFullScreen ? "100%" : "400px") : "64px",
          height: isOpen ? (isFullScreen ? "100%" : "600px") : "64px",
          maxHeight: isOpen ? (isFullScreen ? "100%" : "600px") : "64px",
          maxWidth: isOpen ? (isFullScreen ? "72rem" : "400px") : "64px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen ? (
          <ChatProvider conversationId={conversationId}>
            <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Chat Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullScreen}
                  icon={isFullScreen ? <Minimize className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleChatOpen}
                  icon={<X className="w-5 h-5" />}
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
            className="w-full h-full rounded-full"
            onClick={toggleChatOpen}
            icon={<MessageCircle className="w-7 h-7" />}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
