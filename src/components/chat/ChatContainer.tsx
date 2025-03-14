
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatProvider } from "@/hooks/useChat";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { Conversation } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface ChatContainerProps {
  conversationId?: string;
  className?: string;
}

export const ChatContainer = ({ conversationId: propConversationId, className }: ChatContainerProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use the ID from props or URL params
  const conversationId = propConversationId || paramId;
  
  useEffect(() => {
    const fetchOrCreateConversation = async () => {
      if (!user) {
        return;
      }
      
      setLoading(true);
      
      try {
        // Check if conversation exists
        if (conversationId) {
          const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conversationId)
            .single();
          
          if (error) {
            if (error.code === "PGRST116") { // No rows found
              // Create a new conversation with this ID
              const newConversation = {
                id: conversationId,
                title: "New Conversation",
                user_id: user.id,
                domain: window.location.hostname,
                tenant_id: "35eb8c76-7ed5-4109-a520-99c7402d1f03" // Default tenant ID
              };
              
              const { error: createError } = await supabase
                .from("conversations")
                .insert(newConversation);
              
              if (createError) {
                throw createError;
              }
              
              setConversation(newConversation as Conversation);
            } else {
              throw error;
            }
          } else {
            setConversation(data as Conversation);
          }
        } else {
          // Generate a new conversation ID and redirect
          const newId = uuidv4();
          navigate(`${ROUTES.CONVERSATION}/${newId}`);
        }
      } catch (error: any) {
        console.error("Error fetching conversation:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load conversation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrCreateConversation();
  }, [conversationId, user, navigate, toast]);
  
  if (loading) {
    return (
      <Card className="flex items-center justify-center p-8 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading conversation...</p>
      </Card>
    );
  }
  
  if (!conversationId || !user) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 h-full">
        <p className="mb-4">No conversation selected or you need to sign in.</p>
        <Button onClick={() => navigate(ROUTES.CONVERSATIONS)}>Back to Conversations</Button>
      </Card>
    );
  }
  
  return (
    <ChatProvider conversationId={conversationId}>
      <div className={`flex flex-col h-full bg-background ${className}`}>
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatMessages />
          <ChatFooter />
        </div>
      </div>
    </ChatProvider>
  );
};
