import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import Navbar from "@/components/Navbar";
import { Message } from "@/types/message";
import { ROUTES } from "@/lib/constants";

const ConversationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchConversation = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setConversation(data);

      // Check if user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", id)
        .eq("user_id", user.id);

      if (participantError) {
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        toast({
          title: "Access Denied",
          description: "You are not a participant in this conversation.",
          variant: "destructive",
        });
        navigate(ROUTES.CONVERSATIONS);
        return;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive",
      });
      navigate(ROUTES.CONVERSATIONS);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
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
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !id || !user) return;

    try {
      // Create the message object with all required fields including tenant_id
      const newMessage: Message = {
        conversation_id: id,
        user_id: user.id,
        role: "user",
        content: { text: message },
        metadata: {},
        tenant_id: "35eb8c76-7ed5-4109-a520-99c7402d1f03", // Using default tenant ID
      };

      const { error } = await supabase.from("messages").insert([newMessage]);

      if (error) {
        throw error;
      }

      setMessage("");
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
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
  }, [id, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AuthRequired>
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
    </AuthRequired>
  );
};

export default ConversationDetail;
