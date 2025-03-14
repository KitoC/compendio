import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import Navbar from "@/components/Navbar";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  icon?: string;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();

  const fetchConversations = async () => {
    if (!user || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          conversations:conversation_id (
            id,
            title,
            created_at,
            icon
          )
        `
        )
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      if (data) {
        // Extract conversations from the joined query
        const conversationsList = data
          .map((item) => item.conversations)
          .filter(Boolean);
        setConversations(conversationsList);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!newConversationTitle.trim() || !user || !tenantId) return;

    try {
      // Create a new conversation with tenant_id
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .insert({
            title: newConversationTitle,
            user_id: user.id,
            domain: "default",
            tenant_id: tenantId,
          })
          .select()
          .single();

      if (conversationError) {
        throw conversationError;
      }

      // Add the user as a participant with tenant_id
      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversationData.id,
          user_id: user.id,
          tenant_id: tenantId,
        });

      if (participantError) {
        throw participantError;
      }

      setNewConversationTitle("");
      setOpen(false);
      fetchConversations();

      toast({
        title: "Success",
        description: "Conversation created successfully",
      });

      // Navigate to the new conversation
      navigate(`/conversation/${conversationData.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user, tenantId]);

  return (
    <AuthRequired>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Your Conversations</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new conversation</DialogTitle>
                  <DialogDescription>
                    Enter a name for your conversation.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="title">Conversation name</Label>
                  <Input
                    id="title"
                    value={newConversationTitle}
                    onChange={(e) => setNewConversationTitle(e.target.value)}
                    placeholder="e.g., Project Discussion"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={createConversation}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-4 text-lg">No conversations yet</p>
                <p className="text-muted-foreground mt-2">
                  Start a new conversation to get chatting!
                </p>
              </CardContent>
              <CardFooter className="justify-center pt-2">
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/conversation/${conversation.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">
                        {conversation.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created{" "}
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthRequired>
  );
};

export default Conversations;
