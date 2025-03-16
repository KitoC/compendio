
import React, { useEffect, useState } from "react";
import { websocketService } from "@/services/websocketService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const WebSocketDemo = () => {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Setup WebSocket handlers
    const connectWebSocket = () => {
      websocketService.connect({
        debug: true,
        onOpen: () => {
          setConnected(true);
          setMessages(prev => [...prev, {
            type: 'system',
            message: 'Connected to WebSocket server',
            timestamp: new Date().toISOString()
          }]);
        },
        onMessage: (event) => {
          try {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        },
        onClose: () => {
          setConnected(false);
          setMessages(prev => [...prev, {
            type: 'system',
            message: 'Disconnected from WebSocket server',
            timestamp: new Date().toISOString()
          }]);
        },
        onError: (error) => {
          console.error("WebSocket error:", error);
          setMessages(prev => [...prev, {
            type: 'error',
            message: 'WebSocket error occurred',
            timestamp: new Date().toISOString()
          }]);
        }
      });
    };

    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (message.trim() && connected) {
      websocketService.send({
        text: message,
        timestamp: new Date().toISOString()
      });
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WebSocket Demo
          <Badge variant={connected ? "success" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Send messages to the WebSocket server and see the responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 w-full rounded-md border p-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`mb-2 p-2 rounded ${
                msg.type === 'system' 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : msg.type === 'error' 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : msg.type === 'echo' 
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <div className="text-sm font-medium">
                {msg.type === 'echo' ? 'Server Echo' : msg.type === 'system' ? 'System' : msg.type}
              </div>
              <div>
                {msg.type === 'echo' 
                  ? JSON.stringify(msg.message) 
                  : typeof msg.message === 'string' 
                    ? msg.message 
                    : JSON.stringify(msg.message)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!connected || !message.trim()}
        >
          Send
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WebSocketDemo;
