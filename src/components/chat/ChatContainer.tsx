
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

export const ChatContainer = ({
  conversationId: propConversationId,
  className,
}: ChatContainerProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();

  // Use the ID from props or URL params
  const conversationIdOrAlias = propConversationId || paramId;

  useEffect(() => {
    const fetchOrCreateConversation = async () => {
      if (!user || !tenantId) {
        return;
      }

      setLoading(true);

      try {
        // Check if conversation exists by ID or alias
        if (conversationIdOrAlias) {
          // Try to fetch by ID first (for UUID format)
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationIdOrAlias);
          
          let query = supabase.from("conversations").select("*");
          
          if (isUuid) {
            query = query.eq("id", conversationIdOrAlias);
          } else {
            query = query.eq("alias", conversationIdOrAlias);
          }
          
          const { data, error } = await query.single();

          if (error) {
            if (error.code === "PGRST116") {
              // No rows found - create a new conversation
              if (isUuid) {
                // First check if this ID already exists to prevent duplicate key error
                const { count, error: countError } = await supabase
                  .from("conversations")
                  .select("id", { count: 'exact', head: true })
                  .eq("id", conversationIdOrAlias);
                
                if (countError) {
                  throw countError;
                }
                
                // Only create with provided UUID if it doesn't exist
                if (count === 0) {
                  const newConversation = {
                    id: conversationIdOrAlias,
                    title: "New Conversation",
                    user_id: user.id,
                    domain: window.location.hostname,
                    tenant_id: tenantId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

                  const { error: createError } = await supabase
                    .from("conversations")
                    .insert(newConversation);

                  if (createError) {
                    // If we hit a duplicate key error, fetch the existing conversation instead
                    if (createError.code === "23505") {
                      const { data: existingData, error: fetchError } = await supabase
                        .from("conversations")
                        .select("*")
                        .eq("id", conversationIdOrAlias)
                        .single();
                      
                      if (fetchError) {
                        throw fetchError;
                      }
                      
                      setConversation(existingData as Conversation);
                    } else {
                      throw createError;
                    }
                  } else {
                    setConversation(newConversation as Conversation);
                  }
                } else {
                  // If it exists (somehow), fetch it
                  const { data: existingData, error: fetchError } = await supabase
                    .from("conversations")
                    .select("*")
                    .eq("id", conversationIdOrAlias)
                    .single();
                  
                  if (fetchError) {
                    throw fetchError;
                  }
                  
                  setConversation(existingData as Conversation);
                }
              } else {
                // Create a new conversation with a generated ID but requested alias
                const newId = uuidv4();
                const newConversation = {
                  id: newId,
                  alias: conversationIdOrAlias,
                  title: conversationIdOrAlias.replace(/-/g, ' '),
                  user_id: user.id,
                  domain: window.location.hostname,
                  tenant_id: tenantId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };

                const { error: createError } = await supabase
                  .from("conversations")
                  .insert(newConversation);

                if (createError) {
                  // If alias already exists, fetch it instead
                  if (createError.code === "23505") {
                    const { data: existingData, error: fetchError } = await supabase
                      .from("conversations")
                      .select("*")
                      .eq("alias", conversationIdOrAlias)
                      .single();
                    
                    if (fetchError) {
                      throw fetchError;
                    }
                    
                    setConversation(existingData as Conversation);
                  } else {
                    throw createError;
                  }
                } else {
                  setConversation(newConversation as Conversation);
                }
              }
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
        console.error("Error fetching/creating conversation:", error);
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
  }, [conversationIdOrAlias, user, tenantId, navigate, toast]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-8 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading conversation...</p>
      </Card>
    );
  }

  if (!conversationIdOrAlias || !user || !tenantId) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 h-full">
        <p className="mb-4">No conversation selected or you need to sign in.</p>
        <Button onClick={() => navigate(ROUTES.CONVERSATIONS)}>
          Back to Conversations
        </Button>
      </Card>
    );
  }

  return (
    <ChatProvider conversationId={conversation?.id || ""}>
      <div className={`flex flex-col h-full bg-background ${className}`}>
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatMessages />
          <ChatFooter />
        </div>
      </div>
    </ChatProvider>
  );
};
