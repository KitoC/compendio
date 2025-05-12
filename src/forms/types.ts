import { FormConfig } from "@/components/FormBuilder/types";

export interface IntegrationFormConfigs {
  [key: string]: FormConfig;
}

export interface Credential {
  id: string;
  username: string;
  password?: string;
  expires_at?: string;
  scopes?: string[];
  domain: string;
  type: string;
  connected_service_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface ConnectedService {
  id: string;
  agent_id: string;
  agent_name?: string;
  service_type: string;
  name: string;
  status: string;
  auth_type: string;
  config?: Record<string, unknown>;
  workflow_instance_id?: string;
  created_at: string;
  updated_at?: string;
  tenant_id?: string;
}
