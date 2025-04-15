import { supabase } from "@/integrations/supabase/client";
import { getRedirectUri } from "../supabaseUtils";
import { generateState } from "./shared";
import { getIntegrationWizardState } from "@/components/integrations/AddIntegrationWizard/utils";

const getGoogleOAuthUrl = () => {
  return "https://accounts.google.com/o/oauth2/v2/auth";
};

const getGoogleClientId = () => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID;
};

// Function to generate the authorization URL for Microsoft OAuth 2.0
export async function buildGoogleOAuthUrl(
  redirectUri: string = getRedirectUri(),
  scope?: string
) {
  // Generate code verifier and challenge (PKCE)
  //   const codeChallenge = await generateCodeChallenge(codeVerifier);
  const url = new URL(`${getGoogleOAuthUrl()}/authorize`);

  const defaultScope = "https://www.googleapis.com/auth/gmail.modify";
  // Generate state (to prevent CSRF attacks)
  const state = generateState();
  const integrationWizardState = getIntegrationWizardState();

  // Store state and code verifier in sessionStorage (for later use)
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("provider", "google");

  url.searchParams.append("client_id", getGoogleClientId());
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("scope", scope || defaultScope);
  url.searchParams.append("access_type", "offline");

  // url.searchParams.append("code_challenge", codeChallenge);
  // url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("state", state);
  url.searchParams.append("response_type", "code");

  // First create a record in oauth_states to track this OAuth flow
  const { data, error: oauthStateError } = await supabase
    .from("oauth_states")
    .insert({
      provider: "google",
      state,
      user_id: integrationWizardState?.user_id || null,
      redirect_uri: redirectUri,
      agent_id: integrationWizardState?.agent_id || null,
      service_type: integrationWizardState?.service_type || null,
      tenant_id: integrationWizardState?.tenant_id || null,
      config: {},
      status: "pending",
      tid: null,
    });

  if (oauthStateError) throw oauthStateError;

  return url.toString();
}

export async function exchangeGoogleCodeForTokens(code) {
  const tokenUrl = `${getGoogleOAuthUrl()}/token`;

  const codeVerifier = sessionStorage.getItem("code_verifier"); // Retrieve code_verifier from sessionStorage

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      code: code,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  return data; // This should contain access_token and refresh_token
}
