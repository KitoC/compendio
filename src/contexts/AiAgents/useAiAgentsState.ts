
import { supabase } from "@/integrations/supabase/client";
import { IAiAgent } from "@/types/aiAgents";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const useAiAgentsState = () => {
  const [aiAgents, setAiAgents] = useState<IAiAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAiAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("ai_agents").select("*");

      if (error) {
        throw error;
      }

      setAiAgents(data || []);
    } catch (error: any) {
      toast.error(error.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createAiAgent = useCallback(
    async (agent: Omit<IAiAgent, "id" | "created_at" | "updated_at">) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ai_agents")
          .insert(agent)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        setAiAgents((prevAgents) => [...prevAgents, data]);
        
        toast.success(`${agent.name} has been created successfully`);
        
        return data;
      } catch (error: any) {
        toast.error(error.message || "An unknown error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const updateAiAgent = useCallback(
    async (
      id: string,
      updates: Partial<Omit<IAiAgent, "id" | "created_at" | "updated_at">>
    ) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ai_agents")
          .update(updates)
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        setAiAgents((prevAgents) =>
          prevAgents.map((agent) => (agent.id === id ? data : agent))
        );
        
        toast.success(`${data.name} has been updated successfully`);
        
        return data;
      } catch (error: any) {
        toast.error(error.message || "An unknown error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const deleteAiAgent = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const agentToDelete = aiAgents.find(agent => agent.id === id);
        
        const { error } = await supabase
          .from("ai_agents")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        setAiAgents((prevAgents) =>
          prevAgents.filter((agent) => agent.id !== id)
        );
        
        toast.success(agentToDelete ? `${agentToDelete.name} has been deleted` : "Agent has been deleted");
        
        return true;
      } catch (error: any) {
        toast.error(error.message || "An unknown error occurred");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [aiAgents, toast]
  );

  useEffect(() => {
    fetchAiAgents();
  }, [fetchAiAgents]);

  return { 
    aiAgents, 
    isLoading, 
    fetchAiAgents,
    createAiAgent,
    updateAiAgent,
    deleteAiAgent
  };
};
