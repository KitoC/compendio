import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import Navbar from "@/components/Navbar";
import { Message } from "@/types/message";
import { ROUTES } from "@/lib/constants";
import { isUuid } from "@/utils/generateAlias";
import { useTenant } from "@/contexts/TenantContext";
const ConversationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const fetchConversation = async () => {
    if (!id || !user) return;

    try {
      // Query by ID or alias based on the format
      let query = supabase.from("conversations").select("*");

      if (isUuid(id)) {
        query = query.eq("id", id);
      } else {
        query = query.eq("alias", id);
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      setConversation(data);

      // Check if user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", data.id)
        .eq("user_id", user.id);

      if (participantError) {
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        toast.error("You are not a participant in this conversation.");
        navigate(ROUTES.DASHBOARD);
        return;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load conversation");
      navigate(ROUTES.DASHBOARD);
    }
  };

  const fetchMessages = async () => {
    if (!conversation?.id) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        // Ensure data matches our Message type
        const typedMessages: Message[] = data;
        setMessages(typedMessages);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversation?.id || !user || !tenantId) return;

    try {
      // Create the message object with all required fields including tenant_id
      const newMessage: Message = {
        conversation_id: conversation.id,
        user_id: user.id,
        role: "user",
        content: { text: message },
        metadata: {},
        tenant_id: tenantId,
      };

      const { error } = await supabase.from("messages").insert([newMessage]);

      if (error) {
        throw error;
      }

      setMessage("");
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [id, user, tenantId]);

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages();

      // Subscribe to new messages for this conversation
      const subscription = supabase
        .channel("messages-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            // Add new message to state
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [conversation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-grow container max-w-4xl py-8">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>
              {loading ? "Loading..." : conversation?.title || "Conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="flex-grow mb-4 overflow-y-auto space-y-4 max-h-[60vh]">
              {messages.length === 0 && !loading ? (
                <p className="text-center text-muted-foreground">
                  No messages yet.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.user_id === user?.id
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {typeof msg.content === "object" && msg.content?.text
                      ? msg.content.text
                      : typeof msg.content === "string"
                      ? msg.content
                      : JSON.stringify(msg.content)}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-grow resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConversationDetail;
