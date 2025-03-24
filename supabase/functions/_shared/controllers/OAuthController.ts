import { getEnvKey } from "locals/utils/env";
import { SupabaseController } from "locals/controllers/SupabaseController";
import Logger from "locals/utils/Logger";

interface IOauthState {
  provider: string;
  code: string;
  code_verifier: string;
  redirect_uri: string;
  user_id: string;
  tenant_id: string;
}

interface IOauthProviderConfig {
  tokenExchangeUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface ReqArgs {
  code: string;
  state: string;
  options: {
    credential_name: string;
  };
}

// TODO: Add support for other providers
// TODO: Add support for encryption key versioning and rotation
class OAuthController extends SupabaseController {
  private provider: string | null;
  private providerConfigs: Record<string, IOauthProviderConfig>;
  private oAuthState: IOauthState | null;

  constructor({ logger = new Logger({ name: "OAuthController" }) }) {
    super({ logger });

    this.provider = null;
    this.oAuthState = null;

    this.providerConfigs = {
      azure: {
        tokenExchangeUrl:
          "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
        clientId: getEnvKey("AZURE_CLIENT_ID"),
        clientSecret: getEnvKey("AZURE_CLIENT_SECRET"),
        redirectUri: getEnvKey("AZURE_REDIRECT_URI"),
      },
    };
  }

  async getOAuthState(stateToken: string) {
    const { data, error } = await this.supabase_AS_SUPER_ADMIN
      .from("oauth_states")
      .select("*")
      .eq("state", stateToken)
      .single();

    if (error) {
      this.throwError("Error getting OAuth state", error, 500);
    }

    this.provider = data.provider;
    this.oAuthState = data;

    return data;
  }

  buildTokenExchangeBody({ code }: ReqArgs) {
    if (this.oAuthState?.provider === "azure") {
      return {
        client_id: this.providerConfigs.azure.clientId,
        code,
        redirect_uri: this.oAuthState.redirect_uri,
        grant_type: "authorization_code",
        client_secret: this.providerConfigs.azure.clientSecret,
      };
    }

    return null;
  }
  async getTokenAndCreateCredential(reqArgs: ReqArgs) {
    await this.getOAuthState(reqArgs.state);

    const tokenData = await this.getOauthToken(reqArgs);

    const credential = await this.createOauthCredential(
      tokenData,
      reqArgs.options
    );

    return credential;
  }

  async getOauthToken(reqArgs: ReqArgs) {
    if (!this.provider || !this.oAuthState) {
      this.throwError("Provider not found", 500);
      return;
    }

    const body = this.buildTokenExchangeBody(reqArgs);

    if (!body) {
      this.throwError("Invalid provider", 500);
      return;
    }

    const { provider } = this.oAuthState as IOauthState;

    const tokenResponse = await fetch(
      this.providerConfigs[provider].tokenExchangeUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();

      this.throwError("Error getting OAuth token", error, 500);
    }

    const data = await tokenResponse.json();

    if (!data.access_token || !data.refresh_token) {
      this.throwError("Invalid token response", 500);
      return;
    }

    return data;
  }

  async getOAuthIdToken(reqArgs: ReqArgs) {
    await this.getOAuthState(reqArgs.state);

    const tokenData = await this.getOauthToken(reqArgs);

    const { id_token } = tokenData;

    this.logger.info("id_token", id_token);

    return id_token;
  }

  async getLatestEncryptionVersion() {
    const { data, error } = await this.supabase_AS_SUPER_ADMIN
      .from("encryption_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .single();

    if (error) {
      this.throwError("Error getting latest encryption version", error, 500);
    }

    return data;
  }

  async createOauthCredential(
    tokenData: TokenData,
    options: ReqArgs["options"] = { credential_name: "" }
  ) {
    const latestEncryptionVersion = await this.getLatestEncryptionVersion();

    const { data: credential, error: insertError } =
      await this.supabase_AS_SUPER_ADMIN
        .from("credentials")
        .insert({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(
            Date.now() + tokenData.expires_in * 1000
          ).toISOString(),
          scopes: tokenData.scope?.split(" "),
          type: "oauth",
          user_id: this.oAuthState?.user_id,
          tenant_id: this.oAuthState?.tenant_id,
          encryption_key_id: latestEncryptionVersion.id,
          name: options.credential_name,
        })
        .select()
        .single();

    if (insertError) {
      this.throwError("Credential insert failed", insertError, 500);
    }

    return credential;
  }
}

export default new OAuthController({
  logger: new Logger({ name: "OAuthController" }),
});
