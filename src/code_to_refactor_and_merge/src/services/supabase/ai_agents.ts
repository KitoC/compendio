import makeSupabaseEntity from "../../utils/makeSupabaseEntity";

export type AiAgentRecord = {
  id: string;
  name: string;
  model: string;
  prompt: string;
  domain: string;
  responsibility: string;
  human_name: string;
  enabled: boolean;
  avatar_url: string;
};

export default makeSupabaseEntity<AiAgentRecord, Partial<AiAgentRecord>>({
  entityName: "ai_agents",
  primaryKey: "name",
});
