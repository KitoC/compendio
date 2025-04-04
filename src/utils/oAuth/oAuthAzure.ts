import { getRedirectUri } from "../supabaseUtils";
import { generateState } from "./shared";
import { supabase } from "@/integrations/supabase/client";
import { getIntegrationWizardState } from "@/components/integrations/AddIntegrationWizard/utils";

export const getAzureClientId = () => {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;

  if (clientId) {
    return clientId;
  }

  return "5f3cac71-f5ac-46e0-bf92-e90276a63cd7";
};
const DEFAULT_TENANT_ID = "consumers";

export const getAzureOAuthUrl = (tenantId: string) => {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
};

// Function to generate the authorization URL for Microsoft OAuth 2.0
export async function buildAzureOAuthUrl({
  redirectUri = getRedirectUri(),
  scope,
  prompt,
}: {
  redirectUri?: string;
  scope?: string;
  prompt?: string;
} = {}) {
  // Generate code verifier and challenge (PKCE)
  const tenantId = DEFAULT_TENANT_ID;

  const url = new URL(`${getAzureOAuthUrl(tenantId)}/authorize`);

  // Generate state (to prevent CSRF attacks)
  const state = generateState();

  // Store state and code verifier in sessionStorage (for later use)
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("provider", "azure");

  const integrationWizardState = getIntegrationWizardState();

  url.searchParams.append("client_id", getAzureClientId());
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("prompt", prompt || "select_account");
  url.searchParams.append(
    "scope",
    scope || "openid profile email offline_access User.Read"
  );
  url.searchParams.append("state", state);
  url.searchParams.append("response_type", "code");

  // First create a record in oauth_states to track this OAuth flow
  const { data, error: oauthStateError } = await supabase
    .from("oauth_states")
    .insert({
      provider: "azure",
      state,
      user_id: integrationWizardState?.user_id || null,
      redirect_uri: redirectUri,
      agent_id: integrationWizardState?.agent_id || null,
      service_type: integrationWizardState?.service_type || null,
      tenant_id: integrationWizardState?.tenant_id || null,
      config: {},
      status: "pending",
      tid: tenantId,
    });

  if (oauthStateError) throw oauthStateError;

  return url.toString();
}

export async function exchangeAzureCodeForTokens(code) {
  const tenantId = DEFAULT_TENANT_ID;

  const tokenUrl = `${getAzureOAuthUrl(tenantId)}/token`;

  const codeVerifier = sessionStorage.getItem("code_verifier"); // Retrieve code_verifier from sessionStorage

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getAzureClientId(),
      code: code,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  return data; // This should contain access_token and refresh_token
}
