
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/contexts/websocket";
import { WebSocketMessage } from "@/services/websocketService";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ChatNotificationDemo = () => {
  const [title, setTitle] = useState("Test Notification");
  const [message, setMessage] = useState("This is a test notification");
  const [level, setLevel] = useState<"info" | "success" | "warning" | "error">("info");
  const { isConnected, sendNotification, addMessageHandler, addOpenHandler, addCloseHandler } = useWebSocket();
  const { toast } = useToast();

  // Set up WebSocket event handlers
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === "notification") {
        // Display the notification using toast
        toast({
          title: message.title || "Notification",
          description: message.message,
          variant: message.level === "error" ? "destructive" : "default",
        });
      }
    };

    // Register handlers
    const removeMessageHandler = addMessageHandler(handleMessage);
    const removeOpenHandler = addOpenHandler(() => {
      console.log("WebSocket connected");
    });
    const removeCloseHandler = addCloseHandler(() => {
      console.log("WebSocket disconnected");
    });

    // Cleanup handlers when component unmounts
    return () => {
      removeMessageHandler();
      removeOpenHandler();
      removeCloseHandler();
    };
  }, [addMessageHandler, addOpenHandler, addCloseHandler, toast]);

  const handleSendNotification = () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "WebSocket is not connected",
        variant: "destructive",
      });
      return;
    }

    sendNotification(title, message, level);
    toast({
      title: "Notification Sent",
      description: "WebSocket notification has been sent",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span>Status:</span>
        <Badge variant={isConnected ? "success" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Notification Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Select value={level} onValueChange={(value) => setLevel(value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Notification Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleSendNotification}
          disabled={!isConnected}
          className="w-full"
        >
          Send Notification
        </Button>
      </div>
    </div>
  );
};

export default ChatNotificationDemo;
