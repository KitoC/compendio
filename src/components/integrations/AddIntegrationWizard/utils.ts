import { IntegrationType, ICredential, WizardState } from "./types";

export const INTEGRATION_WIZARD_STATE_KEY = "integration_wizard_state";

export const initialWizardState: WizardState = {
  step: 1,
  agent_id: "",
  service_type: "",
  credential_id: "",
  user_id: "",
  tenant_id: "",
  configValues: {
    name: "",
    description: "",
    icon: "",
    url: "",
    authType: "",
    scopes: [],
  },
};

export const getIntegrationWizardState = (
  fallbackState: WizardState = initialWizardState
) => {
  return sessionStorage.getItem(INTEGRATION_WIZARD_STATE_KEY)
    ? JSON.parse(sessionStorage.getItem(INTEGRATION_WIZARD_STATE_KEY) || "")
    : fallbackState;
};

export const setIntegrationWizardState = (state: WizardState) => {
  sessionStorage.setItem(INTEGRATION_WIZARD_STATE_KEY, JSON.stringify(state));
};

export const clearIntegrationWizardState = () => {
  sessionStorage.removeItem(INTEGRATION_WIZARD_STATE_KEY);
};

export const hasValidationError = (
  selectedType: IntegrationType,
  credential?: ICredential
) => {
  if (!credential) return "No credential selected";

  if (selectedType?.requiredScopes) {
    const hasRequiredScopes = selectedType.requiredScopes.every((scope) =>
      credential.scopes.includes(scope)
    );

    if (!hasRequiredScopes) return "Missing required scopes";
  }

  return false;
};
