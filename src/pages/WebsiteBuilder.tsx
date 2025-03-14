
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthRequired from "@/components/AuthRequired";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { v4 as uuidv4 } from "uuid";

const WebsiteBuilder = () => {
  const [websiteName, setWebsiteName] = useState("");
  const [websiteDescription, setWebsiteDescription] = useState("");
  const [showChatWidget, setShowChatWidget] = useState(false);
  const { toast } = useToast();
  
  const handleCreateWebsite = () => {
    if (!websiteName) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your website",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, you would create a website record in your database
    toast({
      title: "Website created",
      description: "Your website has been created. Now you can use the AI assistant to help build it.",
    });
    
    // Show chat widget to help build the website
    setShowChatWidget(true);
  };
  
  return (
    <AuthRequired>
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Website Builder</CardTitle>
            <CardDescription>
              Create a new website and use our AI assistant to help you build it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteName">Website Name</Label>
              <Input
                id="websiteName"
                placeholder="My Awesome Website"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="websiteDescription">Website Description</Label>
              <Textarea
                id="websiteDescription"
                placeholder="Describe your website and what it's for..."
                value={websiteDescription}
                onChange={(e) => setWebsiteDescription(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button onClick={handleCreateWebsite} className="w-full">
              Create Website
            </Button>
          </CardContent>
        </Card>
        
        {showChatWidget && (
          <div className="mt-8">
            <ChatWidget 
              conversationId={uuidv4()}
              defaultOpen={true}
              position="bottom-right"
            />
          </div>
        )}
      </div>
    </AuthRequired>
  );
};

export default WebsiteBuilder;
