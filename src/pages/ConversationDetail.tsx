
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AuthRequired from '@/components/AuthRequired';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Send, User } from 'lucide-react';

interface Message {
  id: string;
  content: { text: string };
  role: string;
  created_at: string;
  user_id: string | null;
}

interface ConversationDetail {
  id: string;
  title: string | null;
}

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && id) {
      fetchConversation();
      fetchMessages();
      
      // Subscribe to new messages
      const messageSubscription = supabase
        .channel('public:messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prevMessages => [...prevMessages, newMessage]);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(messageSubscription);
      };
    }
  }, [user, id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', id!)
        .single();

      if (error) throw error;
      
      setConversation(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive",
      });
      navigate('/conversations');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            conversation_id: id!,
            content: { text: newMessage },
            role: 'user',
            user_id: user!.id,
            metadata: {}
          }
        ]);

      if (error) throw error;
      
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <AuthRequired>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col max-h-[calc(100vh-64px)]">
          {/* Header */}
          <div className="border-b p-4 flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/conversations')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {conversation?.title || "Conversation"}
            </h1>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.user_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.user_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-xs font-medium">
                        {message.user_id === user?.id ? 'You' : 'Other User'}
                      </span>
                    </div>
                    <p>{message.content.text}</p>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthRequired>
  );
};

export default ConversationDetail;
