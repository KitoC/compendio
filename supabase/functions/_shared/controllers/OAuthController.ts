import { getEnvKey } from "locals/utils/env";
import { BaseController } from "locals/controllers/_BaseController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { ICredential } from "locals/services/CredentialsService";

interface IOauthState {
  id: string;
  state: string;
  provider: string;
  code: string;
  code_verifier: string;
  redirect_uri: string;
  user_id: string;
  tenant_id: string;
  tid: string;
}

interface IOauthProviderConfig {
  tokenExchangeUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  defaultTenantId?: string;
  userInfoUrl: string;
  extractEmailFromUserInfo: (userInfo: Record<string, string>) => string;
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
  private tid: string | null;
  constructor(public context: PublicContext | AuthenticatedContext) {
    super();

    this.provider = null;
    this.oAuthState = null;
    this.tid = null;

    this.providerConfigs = {
      azure: {
        tokenExchangeUrl:
          "https://login.microsoftonline.com/{{tid}}/oauth2/v2.0/token",
        clientId: getEnvKey("AZURE_CLIENT_ID"),
        clientSecret: getEnvKey("AZURE_CLIENT_SECRET"),
        redirectUri: getEnvKey("AZURE_REDIRECT_URI"),
        defaultTenantId: "consumers",
        userInfoUrl: "https://graph.microsoft.com/v1.0/me",
        extractEmailFromUserInfo: (userInfo: Record<string, string>) =>
          userInfo.mail,
      },
      google: {
        tokenExchangeUrl: "https://oauth2.googleapis.com/token",
        clientId: getEnvKey("GOOGLE_CLIENT_ID"),
        clientSecret: getEnvKey("GOOGLE_CLIENT_SECRET"),
        redirectUri: getEnvKey("GOOGLE_REDIRECT_URI"),
        userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
        extractEmailFromUserInfo: (userInfo: Record<string, string>) =>
          userInfo.email,
      },
    };
  }

  getTokenExchangeUrl(provider: string) {
    const { defaultTenantId, tokenExchangeUrl } =
      this.providerConfigs[provider];

    const tid = this.tid || defaultTenantId;
    let url = tokenExchangeUrl;

    if (!tid) {
      url = tokenExchangeUrl.replace("{{tid}}", tid as string);
    }

    return url;
  }

  async getOAuthState(stateToken: string) {
    const oauthState = await this.context.credentialsService.getOAuthState(
      stateToken
    );

    this.provider = oauthState.provider;
    this.oAuthState = oauthState;
    this.tid = oauthState.tid;
    return oauthState;
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

    if (this.oAuthState?.provider === "google") {
      return {
        code,
        client_id: this.providerConfigs.google.clientId,
        client_secret: this.providerConfigs.google.clientSecret,
        redirect_uri: this.oAuthState.redirect_uri,
        grant_type: "authorization_code",
      };
    }

    return null;
  }

  buildRefreshTokenExchangeBody({
    refresh_token,
    scope,
    provider,
  }: {
    refresh_token: string;
    scope: string;
    provider: string;
  }) {
    if (provider === "azure") {
      return {
        client_id: this.providerConfigs.azure.clientId,
        refresh_token,
        grant_type: "refresh_token",
        scope,
        client_secret: this.providerConfigs.azure.clientSecret,
      };
    }

    if (provider === "google") {
      return {
        client_id: this.providerConfigs.google.clientId,
        refresh_token,
        grant_type: "refresh_token",
        scope,
        client_secret: this.providerConfigs.google.clientSecret,
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

  async getOauthCredential(options: ReqArgs["options"]) {
    const credential = await this.context.credentialsService.getCredential(
      options.credential_id
    );

    if (!credential) {
      this.logger.error("No credential found", credential);
    }

    return credential;
  }

  async getUserInfo(provider: string, accessToken: string) {
    const userInfoUrl = this.providerConfigs[provider].userInfoUrl;

    if (!userInfoUrl) {
      return {
        email: "",
      };
    }

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    return {
      email: this.providerConfigs[provider].extractEmailFromUserInfo(userInfo),
    };
  }

  async fetchToken(
    provider: string,
    body: Record<string, string>,
    fail_silently = false
  ) {
    if (!provider) {
      this.throwError("Provider not found", 500);
      return;
    }

    const tokenResponse = await fetch(this.getTokenExchangeUrl(provider), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();

      if (!fail_silently) {
        this.throwError("Error getting OAuth token", error, 500);
      }

      this.logger.error("Error getting OAuth token", error);

      return null;
    }

    const data = await tokenResponse.json();

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

    const tokenResponse = await this.fetchToken(this.provider, body);

    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      this.throwError("Invalid token response", 500);
      return;
    }

    return tokenResponse;
  }

  async getOAuthIdToken(reqArgs: ReqArgs) {
    await this.getOAuthState(reqArgs.state);

    const tokenData = await this.getOauthToken(reqArgs);

    const { id_token } = tokenData;

    return id_token;
  }

  async createOauthCredential(
    tokenData: TokenData,
    options: ReqArgs["options"] = { credential_name: "" }
  ) {
    const userInfo = await this.getUserInfo(
      this.provider as string,
      tokenData.access_token
    );

    const credential =
      await this.context.credentialsService.createOauthCredential({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
        expires_in: tokenData.expires_in,
        provider: this.provider as string,
        user_id: this.oAuthState?.user_id as string,
        tenant_id: this.oAuthState?.tenant_id as string,
        credential_name: options.credential_name,
        tid: this.oAuthState?.tid as string,
        associated_email: userInfo.email,
      });

    await this.context.credentialsService.deleteOAuthState(
      this.oAuthState?.id as string
    );

    return credential;
  }

  async getRefreshedAccessToken(id: string) {
    if (!id) {
      this.throwError("No credential id found", 500);
      return;
    }

    const credential = await this.context.credentialsService.getCredential(id);
    const tokenResponse = await this.refreshOauthCredential(credential);

    if (!tokenResponse) {
      this.throwError("No refresh token found", 500);
      return;
    }

    return tokenResponse.tokenData.access_token;
  }

  async refreshOauthCredential(credential: ICredential) {
    this.tid = credential.tid;

    const refreshToken =
      await this.context.credentialsService.decryptRefreshToken(credential.id);

    const body = this.buildRefreshTokenExchangeBody({
      refresh_token: refreshToken,
      scope: credential.scopes.join(" "),
      provider: credential.provider,
    });

    if (!body) {
      this.throwError("Invalid provider", 500);
      return;
    }

    const tokenData = await this.fetchToken(credential.provider, body, true);
    let refresh_failed = false;

    if (!tokenData.access_token) {
      refresh_failed = true;
    }

    const credentialId =
      await this.context.credentialsService.updateOauthCredential({
        id: credential.id,
        refresh_token: refreshToken,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        expires_in: tokenData.expires_in,
        refresh_failed,
      });

    return { credentialId, tokenData };
  }
}

export { OAuthController };
