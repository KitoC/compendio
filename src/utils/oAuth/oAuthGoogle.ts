import { getRedirectUri } from "../supabaseUtils";
import { getAzureOAuthUrl } from "./oAuthAzure";
import { generateState } from "./shared";

const getGoogleOAuthUrl = () => {
  return "https://accounts.google.com/o/oauth2/v2/auth";
};

const getGoogleClientId = () => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID;
};

// Function to generate the authorization URL for Microsoft OAuth 2.0
export async function buildGoogleOAuthUrl(
  redirectUri?: string,
  scope?: string
) {
  // Generate code verifier and challenge (PKCE)
  //   const codeChallenge = await generateCodeChallenge(codeVerifier);
  const url = new URL(`${getAzureOAuthUrl()}/authorize`);

  const defaultScope =
    "https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent";
  // Generate state (to prevent CSRF attacks)
  const state = generateState();

  // Store state and code verifier in sessionStorage (for later use)
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("provider", "google");

  url.searchParams.append("client_id", getGoogleClientId());
  url.searchParams.append("redirect_uri", redirectUri || getRedirectUri());
  url.searchParams.append("scope", scope || defaultScope);

  //   url.searchParams.append("code_challenge", codeChallenge);
  //   url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("state", state);
  url.searchParams.append("response_type", "code");

  return url.toString();
}

export async function exchangeGoogleCodeForTokens(code) {
  const tokenUrl = `${getAzureOAuthUrl()}/token`;

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
