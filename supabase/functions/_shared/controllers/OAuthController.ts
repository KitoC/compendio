import { getEnvKey } from "locals/utils/env";
import { BaseController } from "locals/controllers/_BaseController";
import { PublicContext } from "locals/middleware/withPublicContext";

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
    credential_id?: string;
  };
}

// TODO: Add support for other providers
// TODO: Add support for encryption key versioning and rotation
class OAuthController extends BaseController {
  private provider: string | null;
  private providerConfigs: Record<string, IOauthProviderConfig>;
  private oAuthState: IOauthState | null;

  constructor(public req: Request, public context: PublicContext) {
    super();

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
    console.log("GETTING OAUTH STATE");
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
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

    return await this.createOauthCredential(tokenData, reqArgs.options);
  }

  async getOauthCredential(options: ReqArgs["options"]) {
    console.log("GETTING OAUTH CREDENTIAL");

    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
      .from("credentials")
      .select("*")
      .eq("id", options.credential_id)
      .single();

    if (error) {
      this.logger.error("Error getting OAuth credential", error);
    }

    return data;
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
    console.log("GETTING LATEST ENCRYPTION VERSION");

    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
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

    console.log("TOKEN JSON", JSON.stringify(tokenData, null, 2));
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN.rpc(
      "insert_credential",
      {
        _encryption_key_id: latestEncryptionVersion.id,
        _encryption_key: getEnvKey("ENCRYPTION_KEY"),
        _access_token: tokenData.access_token,
        _refresh_token: tokenData.refresh_token,
        _scopes: tokenData.scope?.split(" "),
        _type: "oauth",
        _user_id:
          this.oAuthState?.user_id || "f54647ab-6459-4769-9f73-55f32fb7ecdc",
        _tenant_id:
          this.oAuthState?.tenant_id || "24d940cf-490c-4806-a46f-e995132d0883",
        _expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        _provider: this.provider,
        _name: options.credential_name,
        _domain: null,
        _password: null,
        _username: null,
      }
    );

    if (error) {
      this.throwError("Error setting current_setting", error, 500);
    }

    return data;
  }

  async updateOauthCredential(
    tokenData: TokenData,
    options: ReqArgs["options"] = { credential_name: "" }
  ) {
    const latestEncryptionVersion = await this.getLatestEncryptionVersion();

    const { data: credentialId, error: insertError } =
      await this.context.supabase_AS_SUPER_ADMIN.rpc("update_credential", {
        _access_token: tokenData.access_token,
        _refresh_token: tokenData.refresh_token,
        _expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        _scopes: tokenData.scope?.split(" "),
        _encryption_key_id: latestEncryptionVersion.id,
      });

    if (insertError) {
      this.throwError("Credential insert failed", insertError, 500);
    }

    return credentialId;
  }
}

export { OAuthController };
