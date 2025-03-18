import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import Navbar from "@/components/Navbar";
import { ROUTES } from "@/lib/constants";
import { Conversation } from "@/types/chat";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [user, tenantId]);

  const fetchConversations = async () => {
    if (!user || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setConversations(data as Conversation[]);
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error(error.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user || !tenantId) return;

    try {
      const id = uuidv4();
      const newConversation = {
        id,
        title: "New Conversation",
        user_id: user.id,
        domain: window.location.hostname,
        tenant_id: tenantId,
      };

      const { error } = await supabase
        .from("conversations")
        .insert([newConversation]);

      if (error) {
        throw error;
      }

      navigate(ROUTES.CONVERSATIONS_DETAIL.replace(":id", id));
      toast.success("New conversation created");
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Failed to create conversation");
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      toast.success("Conversation deleted");
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast.error(error.message || "Failed to delete conversation");
    }
  };

  return (
    <AuthRequired>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow container max-w-4xl py-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p>
                  No conversations yet. Start one by clicking the button below.
                </p>
              ) : (
                <div className="grid gap-4">
                  {conversations.map((conversation) => (
                    <Card
                      key={conversation.id}
                      className="border-2 border-primary"
                    >
                      <CardContent className="flex items-center justify-between">
                        <a
                          href={ROUTES.CONVERSATIONS_DETAIL.replace(
                            ":id",
                            conversation.id
                          )}
                        >
                          {conversation.title || "Conversation"}
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteConversation(conversation.id)}
                        >
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Button className="mt-4" onClick={createNewConversation}>
                Create New Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthRequired>
  );
};

export default Conversations;
