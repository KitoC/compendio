// NO_CHANGE

import { BaseService } from "locals/services/_BaseService";
import { getEnvKey } from "locals/utils/env";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";

interface RequiredContext {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
}

interface CreateCredentialArgs {
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
  provider: string;
  user_id: string;
  tenant_id: string;
  credential_name: string;
  tid: string;
}

interface UpdateCredentialArgs {
  id: string;
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
  refresh_failed: boolean;
}

export interface ICredential {
  id: string;
  refresh_token: string;
  scopes: string[];
  access_token: string;
  expires_in: number;
  provider: string;
  user_id: string;
  tenant_id: string;
  tid: string;
}

class CredentialsService extends BaseService {
  constructor(public req: Request, public context: RequiredContext) {
    super(context);
  }

  async getOAuthState(stateToken: string) {
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
      .from("oauth_states")
      .select("*")
      .eq("state", stateToken)
      .single();

    if (error) {
      this.logger.info("stateToken", stateToken);
      this.throwError("Error getting OAuth state", error, 500);
    }
    return data;
  }

  async deleteOAuthState(id: string) {
    const { error } = await this.context.supabase_AS_SUPER_ADMIN
      .from("oauth_states")
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error("Error deleting OAuth state", error);
    }
  }

  async getCredential(credentialId?: string) {
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
      .from("credentials")
      .select("*")
      .eq("id", credentialId)
      .single();

    if (error) {
      this.throwError("Error getting credential", error, 500);
    }

    return data;
  }

  async getExpiredCredentials() {
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN
      .from("credentials")
      .select("*")
      .lte("expires_at", new Date().toISOString());

    if (error) {
      this.throwError("Error getting expired credentials", error, 500);
    }

    return data;
  }

  async getLatestEncryptionVersion() {
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

  async createOauthCredential(args: CreateCredentialArgs) {
    const latestEncryptionVersion = await this.getLatestEncryptionVersion();

    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN.rpc(
      "insert_credential",
      {
        _encryption_key_id: latestEncryptionVersion.id,
        _encryption_key: getEnvKey("ENCRYPTION_KEY"),
        _access_token: args.access_token,
        _refresh_token: args.refresh_token,
        _scopes: args.scope?.split(" "),
        _type: "oauth",
        _user_id: args?.user_id,
        _tenant_id: args?.tenant_id,
        _expires_at: new Date(
          Date.now() + args.expires_in * 1000
        ).toISOString(),
        _provider: args.provider,
        _name: args.credential_name,
        _domain: null,
        _password: null,
        _username: null,
        _tid: args.tid,
      }
    );

    if (error) {
      this.throwError("Error setting current_setting", error, 500);
    }

    return data;
  }

  async updateOauthCredential(args: UpdateCredentialArgs) {
    const latestEncryptionVersion = await this.getLatestEncryptionVersion();

    const { data: credentialId, error: insertError } =
      await this.context.supabase_AS_SUPER_ADMIN.rpc("update_credential", {
        _access_token: args.access_token,
        _refresh_token: args.refresh_token,
        _expires_at: new Date(
          Date.now() + args.expires_in * 1000
        ).toISOString(),
        _scopes: args.scope?.split(" "),
        _encryption_key_id: latestEncryptionVersion.id,
        _encryption_key: getEnvKey("ENCRYPTION_KEY"),
        _credential_id: args.id,
        _refresh_failed: args.refresh_failed,
      });

    if (insertError) {
      this.throwError("Credential insert failed", insertError, 500);
    }

    return credentialId;
  }

  async decryptRefreshToken(credentialId: string) {
    const { data, error } = await this.context.supabase_AS_SUPER_ADMIN.rpc(
      "decrypt_refresh_token",
      {
        _credential_id: credentialId,
        _encryption_key: getEnvKey("ENCRYPTION_KEY"),
      }
    );

    if (error) {
      this.throwError("Failed to decrypt refresh token", error, 500);
    }

    return data;
  }
}

export { CredentialsService };
