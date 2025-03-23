import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IAiAgent } from "@/types/aiAgents";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

// Query keys for better cache management
export const QUERY_KEYS = {
  aiAgents: "aiAgents",
};

export const useAiAgentsQuery = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Fetch all AI agents
  const {
    data: aiAgents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.aiAgents, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return data as IAiAgent[];
    },
    enabled: !!tenantId, // Only run query if we have a tenantId
  });

  // Create a new AI agent
  const createAgent = useMutation({
    mutationFn: async (newAgent: Partial<IAiAgent>) => {
      if (!tenantId) throw new Error("Tenant ID is required");

      // Ensure required fields are present
      const agentData = {
        name: newAgent.name || "",
        human_name: newAgent.human_name || "",
        prompt: newAgent.prompt || "",
        responsibility: newAgent.responsibility || "",
        model: newAgent.model || "gpt-4",
        enabled: newAgent.enabled !== undefined ? newAgent.enabled : true,
        tenant_id: tenantId,
        ...newAgent,
      };

      const { data, error } = await supabase
        .from("ai_agents")
        .insert([agentData])
        .select();

      if (error) throw error;
      return data[0] as IAiAgent;
    },
    onSuccess: () => {
      // Invalidate and refetch the AI agents list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.aiAgents, tenantId],
      });
      toast.success("AI agent created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create AI agent: ${error.message}`);
    },
  });

  // Update an existing AI agent
  const updateAgent = useMutation({
    mutationFn: async (agent: IAiAgent) => {
      if (!tenantId) throw new Error("Tenant ID is required");

      const { data, error } = await supabase
        .from("ai_agents")
        .update(agent)
        .eq("id", agent.id)
        .eq("tenant_id", tenantId)
        .select();

      if (error) throw error;
      return data[0] as IAiAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.aiAgents, tenantId],
      });
      toast.success("AI agent updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update AI agent: ${error.message}`);
    },
  });

  // Delete an AI agent
  const deleteAgent = useMutation({
    mutationFn: async (agentId: string) => {
      if (!tenantId) throw new Error("Tenant ID is required");

      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", agentId)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.aiAgents, tenantId],
      });
      toast.success("AI agent deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete AI agent: ${error.message}`);
    },
  });

  // Set up real-time subscription
  const setupRealTimeSubscription = () => {
    if (!tenantId) return () => {};

    const channel = supabase
      .channel("ai-agents-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_agents",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // When any change happens to the ai_agents table, invalidate the cache
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.aiAgents, tenantId],
          });
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    aiAgents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    setupRealTimeSubscription,
  };
};
