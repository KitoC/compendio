export interface IAiAgent {
  id: string;
  name: string;
  human_name: string;
  responsibility: string;
  enabled: boolean;
  prompt: string;
  model: string;
  avatar_url: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
