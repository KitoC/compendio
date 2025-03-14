
export interface Message {
  id?: string;
  conversation_id: string;
  user_id?: string;
  role: string;
  content: any;
  metadata: any;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  tenant_id: string;  // Changed from optional to required to match DB
}
