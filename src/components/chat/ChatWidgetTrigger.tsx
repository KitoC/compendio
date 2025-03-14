
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ChatWidget from "./ChatWidget";

const ChatWidgetTrigger = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <>
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 rounded-full"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Chat with us
      </Button>
      
      {isVisible && (
        <ChatWidget 
          defaultOpen={true}
          position="bottom-right"
        />
      )}
    </>
  );
};

export default ChatWidgetTrigger;
