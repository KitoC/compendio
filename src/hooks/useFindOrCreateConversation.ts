import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import type { Conversation } from "@/types/chat";

interface UseFindOrCreateConversationProps {
  conversationIdOrAlias: string;
  tenantId: string;
}

const useFindOrCreateConversation = ({
  conversationIdOrAlias,
  tenantId,
}: UseFindOrCreateConversationProps) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              conversationIdOrAlias
            );

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
                  .select("id", { count: "exact", head: true })
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
                      const { data: existingData, error: fetchError } =
                        await supabase
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
                  const { data: existingData, error: fetchError } =
                    await supabase
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
                  title: conversationIdOrAlias.replace(/-/g, " "),
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
                    const { data: existingData, error: fetchError } =
                      await supabase
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
          // TODO: figure out what happens when no idOrAlias is provided
          // Generate a new conversation ID and redirect
          //   onNotFound?.();
        }
      } catch (error) {
        console.error("Error fetching/creating conversation:", error);
        toast.error(error.message || "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateConversation();
  }, [conversationIdOrAlias, user, tenantId, navigate]);

  return { conversation, loading };
};

export default useFindOrCreateConversation;
