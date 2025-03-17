import { supabase } from "@/integrations/supabase/client";
import { IAiAgent } from "@/types/aiAgents";
import { useEffect, useState, useCallback } from "react";

export const useAiAgentsState = () => {
  const [aiAgents, setAiAgents] = useState<IAiAgent[]>([]);

  const fetchAiAgents = useCallback(async () => {
    const { data, error } = await supabase.from("ai_agents").select("*");

    setAiAgents(data);
  }, []);

  useEffect(() => {
    fetchAiAgents();
  }, [fetchAiAgents]);

  return { aiAgents };
};
