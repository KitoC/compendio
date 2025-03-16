
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/contexts/websocket";
import { notificationService, NotificationLevel } from "@/services/notificationService";

export default function ChatNotificationDemo() {
  const [message, setMessage] = useState("This is a test notification");
  const [title, setTitle] = useState("Test Notification");
  const [level, setLevel] = useState<NotificationLevel>("info");
  const { isConnected, emit } = useWebSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send the notification through WebSocket
      emit({
        type: "notification",
        title,
        message,
        level,
        timestamp: new Date().toISOString(),
      });

      // Also show a local toast
      notificationService.showToast("Success", "Notification sent successfully", "success");
    } catch (error) {
      console.error("Error sending notification:", error);
      notificationService.showToast("Error", "Failed to send notification", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Connection Status</label>
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Message</label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Notification message"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Level</label>
        <Select value={level} onValueChange={(value: any) => setLevel(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!isConnected}>
        Send Notification
      </Button>
    </form>
  );
}
