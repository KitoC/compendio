
import { get } from "http";
import { getRedirectUri } from "./supabaseUtils";

export const getAzureClientId = () => {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;

  if (clientId) {
    return clientId;
  }

  return "9c068859-56dd-4d54-8c4a-2c4d79c086e5";
};

export const getAzureOAuthUrl = () => {
  const tenantId = "consumers";

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
};

// Function to generate the code verifier (PKCE)
function generateCodeVerifier(length = 128) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let codeVerifier = "";
  for (let i = 0; i < length; i++) {
    codeVerifier += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return codeVerifier;
}

// Function to generate code challenge (PKCE)
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const base64String = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // Base64Url encoding
  return base64String;
}

// Function to generate a random string (for state parameter)
function generateState(length = 16) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let state = "";
  for (let i = 0; i < length; i++) {
    state += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return state;
}

// Function to generate the authorization URL for Microsoft OAuth 2.0
export async function buildAzureOAuthUrl() {
  // Generate code verifier and challenge (PKCE)
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const scope = "openid profile email"; // OAuth scopes you want
  const url = new URL(`${getAzureOAuthUrl()}/authorize`);

  // Generate state (to prevent CSRF attacks)
  const state = generateState();

  // Store state and code verifier in sessionStorage (for later use)
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("code_verifier", codeVerifier);
  sessionStorage.setItem("provider", "azure");

  url.searchParams.append("client_id", getAzureClientId());
  url.searchParams.append("redirect_uri", getRedirectUri());
  url.searchParams.append("scope", scope);
  url.searchParams.append("code_challenge", codeChallenge);
  url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("state", state);
  url.searchParams.append("response_type", "code");

  return url.toString();
}

export function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export async function exchangeAzureCodeForTokens(code) {
  const tokenUrl = `${getAzureOAuthUrl()}/token`;

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
