
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AuthRequired from '@/components/AuthRequired';
import Navbar from '@/components/Navbar';

interface Conversation {
  id: string;
  title: string | null;
  icon: string | null;
  created_at: string;
}

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      // First get all conversation IDs the user participates in
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (participationsError) throw participationsError;

      if (participations && participations.length > 0) {
        // Get the actual conversations
        const conversationIds = participations.map(p => p.conversation_id);
        
        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, icon, created_at')
          .in('id', conversationIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setConversations(data || []);
      } else {
        setConversations([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      // 1. Create a new conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          { 
            title: 'New Conversation', 
            user_id: user!.id,
            domain: 'app'
          }
        ])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // 2. Add the creator as a participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { 
            conversation_id: conversationData.id, 
            user_id: user!.id 
          }
        ]);

      if (participantError) throw participantError;

      // 3. Navigate to the new conversation
      toast({
        title: "Success",
        description: "New conversation created",
      });
      
      navigate(`/conversation/${conversationData.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthRequired>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Your Conversations</h1>
            <Button onClick={createNewConversation}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Conversation
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/conversation/${conversation.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                        {conversation.title || "Untitled Conversation"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a new conversation to get started
                  </p>
                  <Button onClick={createNewConversation}>
                    Create Conversation
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthRequired>
  );
};

export default Conversations;
