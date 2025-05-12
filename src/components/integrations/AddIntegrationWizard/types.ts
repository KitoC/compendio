import { Database } from "@/integrations/supabase/types";
import { FormConfig } from "@/components/FormBuilder/types";

export interface AiAgent {
  id: string;
  name: string;
  human_name?: string;
  avatar_url?: string;
  responsibility?: string;
  enabled?: boolean;
}

export interface Credential {
  id: string;
  username: string;
  expires_at?: string;
  scopes?: string[];
  domain: string;
  type: string;
}

export interface AddIntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interface for storing wizard state
export interface WizardState {
  step: number;
  agent_id: string;
  service_type: string;
  credential_id: string;
  user_id: string;
  tenant_id: string;
  configValues: {
    name: string;
    description: string;
    icon: string;
    url: string;
    authType: string;
    scopes: string[];
  };
}

export interface StepProps {
  resetAndClose: () => void;
  nextStep: () => void;
  prevStep: () => void;
  wizardState: WizardState;
  onStepDataCapture: (data: Partial<WizardState>) => void;
  onClose?: () => void;
}

export type ICredential = Database["public"]["Tables"]["credentials"]["Row"] & {
  scopes: string[];
  associated_email: string;
};

export type IntegrationType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  authType: string;
  oauthProvider: string;
  webhookChangeType?: string;
  webhookResource?: string;
  steps?: React.ComponentType<StepProps>[];
  formConfig: FormConfig;
  requiredScopes?: string[];
};
