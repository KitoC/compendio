import { Database } from "@/integrations/supabase/types";

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
  selectedAgentId: string;
  selectedIntegrationType: string;
  selectedCredentialId: string;
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
};
