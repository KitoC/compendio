
import { FormConfig } from "@/components/form-builder/types";

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
}

export interface ConnectedService {
  id: string;
  agent_id: string;
  service_type: string;
  name: string;
  status: string;
  auth_type: string;
  config?: Record<string, unknown>;
  workflow_instance_id?: string;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}
