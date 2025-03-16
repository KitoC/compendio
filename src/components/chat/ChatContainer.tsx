
import { useChat } from "@/hooks/useChat";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import { Badge } from "@/components/ui/badge";
import { WifiIcon, WifiOffIcon } from "lucide-react";

export const ChatContainer = () => {
  const { isTyping, wsConnected } = useChat();
  
  return (
    <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-xl font-semibold">Conversation</h2>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
              <WifiIcon className="h-3 w-3" />
              <span>Connected</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-500 border-gray-200">
              <WifiOffIcon className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
        </div>
      </div>
      
      <ChatMessages />
      
      <div className="border-t">
        {isTyping && (
          <div className="p-2 text-sm text-muted-foreground">
            <span className="inline-block">
              <span className="dot-typing"></span>
            </span>
          </div>
        )}
        <ChatFooter />
      </div>
      
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          color: currentColor;
          box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          animation: dot-typing 1.5s infinite linear;
        }
        
        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
          50% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px -10px 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px -10px 0 0 currentColor;
          }
          100% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor, 10014px 0 0 0 currentColor;
          }
        }
      `}</style>
    </div>
  );
};
