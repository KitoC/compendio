
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { websocketService } from "@/services/websocketService";
import { useToast } from "@/hooks/use-toast";

const ChatNotificationDemo = () => {
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification from the WebSocket service!');
  const [level, setLevel] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up WebSocket connection
    const setupWebSocket = async () => {
      try {
        await websocketService.connect({
          onOpen: () => {
            setIsConnected(true);
            console.log('WebSocket connected');
          },
          onMessage: (message) => {
            console.log('WebSocket message received:', message);
            
            // Handle notification messages
            if (message.type === 'notification') {
              toast({
                title: message.title,
                description: message.message,
                variant: message.level === 'error' ? 'destructive' : 'default',
              });
            }
          },
          onClose: () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
          },
          onError: (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
          }
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    setupWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, [toast]);

  const handleSendNotification = () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "WebSocket is not connected. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    // Method 1: Using the websocketService directly
    websocketService.sendNotification(title, message, level);
    
    // Method 2: Sending via the WebSocket with a specific command type
    websocketService.send({
      type: 'send.notification',
      title,
      message,
      level,
    });
    
    toast({
      title: "Notification sent",
      description: "The notification has been sent to all connected clients.",
      variant: "default",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>WebSocket Notification Demo</CardTitle>
        <CardDescription>
          Send a notification to all connected WebSocket clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Notification Message</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
          />
        </div>
        <div className="space-y-2">
          <Label>Notification Level</Label>
          <RadioGroup value={level} onValueChange={(value) => setLevel(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="info" id="info" />
              <Label htmlFor="info">Info</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="success" id="success" />
              <Label htmlFor="success">Success</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="warning" id="warning" />
              <Label htmlFor="warning">Warning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="error" id="error" />
              <Label htmlFor="error">Error</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendNotification} 
          disabled={!isConnected}
          className="w-full"
        >
          Send Notification
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatNotificationDemo;
