// NO_CHANGE

import {
  createClient,
  SupabaseClient,
  // @ts-expect-error - Supabase client is not typed
} from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { getEnvKey } from "locals/utils/env";
import Logger from "locals/utils/Logger";
import { RequestController } from "locals/controllers/RequestController";

const ROLES = {
  SUPER_ADMIN: "super-admin",
  TENANT_OWNER: "tenant-owner",
  MEMBER: "member",
  GUEST: "guest",
  ADMIN: "admin",
};

interface IConstructorParams {
  logger?: Logger;
}

class SupabaseController extends RequestController {
  public supabase_AS_SUPER_ADMIN: SupabaseClient;
  public logger: Logger;
  private _supabase: SupabaseClient;
  private token: string | null;
  private authHeader: string | null;
  private roles: string[] | null;
  private tenantId: string | null;
  private user: object | null;

  constructor({
    logger = new Logger({ name: "SupabaseController" }),
  }: IConstructorParams) {
    super();

    this.logger = logger;
    this.supabase_AS_SUPER_ADMIN = createClient(
      getEnvKey("SUPABASE_URL"),
      getEnvKey("SUPABASE_ANON_KEY")
    );
    this.token = null;
    this.roles = null;
    this.tenantId = null;
    this.user = null;
    this.authHeader = null;
  }

  private checkSupabaseInitialized() {
    if (!this._supabase) {
      this.throwError("Supabase client not initialized", 500);
    }
  }

  async initialize(req: Request, noAuth: boolean = false) {
    if (!noAuth) {
      this.getToken(req);
    }

    this._supabase = createClient(
      getEnvKey("SUPABASE_URL"),
      getEnvKey("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: this.authHeader } } }
    );

    if (!noAuth) {
      await this.getUserTenantAndRoles(req);
    }
  }

  getToken(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    this.authHeader = authHeader;
    this.token = token || null;

    if (!authHeader) {
      this.throwError("Authorization header is required", 401);
    }
  }

  async getUser(req: Request) {
    this.checkSupabaseInitialized();
    this.getToken(req);

    const { data, error } = await this._supabase.auth.getUser(this.token);

    this.logger.debug("data", data);
    this.logger.debug("error", error);
    if (error) {
      this.throwError("Error getting user", error, 500);
    }

    return data;
  }

  async getUserTenantAndRoles(req: Request) {
    const user = await this.getUser(req);

    const { data: tenantUser } = await this.supabase_AS_SUPER_ADMIN
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.user.id)
      .single();

    const tenantId = tenantUser.tenant_id;

    const { data: roles, error: rolesError } =
      await this.supabase_AS_SUPER_ADMIN
        .from("user_roles")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("tenant_id", tenantId);

    if (rolesError) {
      this.throwError("Error getting roles", rolesError, 500);
    }

    this.roles = roles.map((role: { role_type: string }) => role.role_type);
    this.tenantId = tenantId;
    this.user = user;

    return { user, tenantId, roles };
  }

  private hasRole(role: string) {
    return this.roles?.includes(role);
  }

  private isSuperAdmin() {
    return this.roles?.includes(ROLES.SUPER_ADMIN);
  }

  private rolesNotSet() {
    if (!this.roles) {
      this.throwError("Roles are not set", 500);
    }
  }

  private noPrivileges() {
    this.throwError("User does not have required role", 403);
  }

  get tenant_id() {
    return this.tenantId;
  }

  requireTenantId() {
    if (!this.tenantId) {
      this.throwError("Tenant ID is required", 400);
    }
  }

  requireRole(role: string) {
    if (this.isSuperAdmin()) {
      return;
    }

    this.rolesNotSet();

    if (!this.hasRole(role)) {
      this.noPrivileges();
    }
  }

  allowedRoles(roles: string[]) {
    if (this.isSuperAdmin()) {
      return;
    }

    this.rolesNotSet();

    console.log(roles, this.roles);
    if (!roles.some((role) => this.roles?.includes(role))) {
      this.noPrivileges();
    }
  }

  get supabase() {
    return this._supabase;
  }
}

export { ROLES, SupabaseController };

export default new SupabaseController({
  logger: new Logger({ name: "SupabaseController" }),
});
