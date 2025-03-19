import { supabase } from "@/integrations/supabase/client";
import { IAiAgent } from "@/types/aiAgents";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

export const useAiAgentsState = () => {
  const [aiAgents, setAiAgents] = useState<IAiAgent[]>([]);
  const params = useParams();

  const fetchAiAgents = useCallback(async () => {
    const { data, error } = await supabase.from("ai_agents").select("*");

    setAiAgents(data);
  }, []);

  useEffect(() => {
    fetchAiAgents();
  }, [fetchAiAgents]);

  const currentAgent = aiAgents.find((agent) => agent.name === params.id);

  return { aiAgents, currentAgent };
};
