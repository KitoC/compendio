import { useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types/message";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { aiChatService } from "@/services/aiChatService";
import { nanoid } from "nanoid";

export const useChatState = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user, tenantId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId || !user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          const typedMessages: Message[] = data;
          setMessages(typedMessages);
        }
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        toast.error(error.message || "Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, user, toast]);

  const scrollToBottom = useCallback(() => {
    messagesContainerRef.current?.scroll({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !tenantId) return;

      const newMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: { text: content },
        metadata: {},
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollToBottom();

      try {
        const { error } = await supabase.from("messages").insert([newMessage]);

        if (error) {
          throw error;
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to send message");
      }
    },
    [conversationId, user, tenantId, scrollToBottom, toast]
  );

  const processMessageWithAI = useCallback(
    async (messageContent: string) => {
      if (!conversationId || !user || !tenantId) return;

      setIsProcessing(true);
      const userMessageId = nanoid();

      const userMessage: Message = {
        id: userMessageId,
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: { text: messageContent },
        metadata: {},
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      scrollToBottom();

      try {
        const aiResponse = await aiChatService({
          conversationId,
          message: messageContent,
          userId: user.id,
          tenantId,
        });

        const aiMessage: Message = {
          id: uuidv4(),
          conversation_id: conversationId,
          user_id: "ai",
          role: "assistant",
          content: { text: aiResponse },
          metadata: {},
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        scrollToBottom();

        try {
          const { error } = await supabase.from("messages").insert([aiMessage]);

          if (error) {
            throw error;
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to save AI message");
        }
      } catch (error: any) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== userMessageId)
        );
        toast.error(error.message || "Failed to process message with AI");
      } finally {
        setIsProcessing(false);
      }
    },
    [conversationId, user, tenantId, scrollToBottom, toast]
  );

  return {
    messages,
    isLoading,
    isProcessing,
    messagesContainerRef,
    addMessage,
    processMessageWithAI,
  };
};
