
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
      toast({
        title: "Error fetching AI agents",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
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
        
        toast({
          title: "AI agent created",
          description: `${agent.name} has been created successfully`,
        });
        
        return data;
      } catch (error: any) {
        toast({
          title: "Error creating AI agent",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
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
        
        toast({
          title: "AI agent updated",
          description: `${data.name} has been updated successfully`,
        });
        
        return data;
      } catch (error: any) {
        toast({
          title: "Error updating AI agent",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
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
        
        toast({
          title: "AI agent deleted",
          description: agentToDelete ? `${agentToDelete.name} has been deleted` : "Agent has been deleted",
        });
        
        return true;
      } catch (error: any) {
        toast({
          title: "Error deleting AI agent",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
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
