// NO_CHANGE

import Logger from "locals/utils/Logger";
import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

const ROLES = {
  SUPER_ADMIN: "super-admin",
  TENANT_OWNER: "tenant-owner",
  MEMBER: "member",
  GUEST: "guest",
  ADMIN: "admin",
};

class AuthService extends BaseSupabaseService {
  private token: string | null;
  private authHeader: string | null;

  public logger: Logger;
  public roles: string[] | null;
  public tenantId: string | null;
  public user: object | null;

  constructor(public req: Request, public context: BaseRequiredContext) {
    super(context);

    this.logger = new Logger({ name: "AuthService" });
    this.token = null;
    this.roles = null;
    this.tenantId = null;
    this.user = null;
    this.authHeader = null;
  }

  async initialize() {
    this.getToken();

    await this.getUserTenantAndRoles();
  }

  getToken() {
    const authHeader = this.req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    this.authHeader = authHeader;
    this.token = token || null;

    if (!authHeader) {
      this.throwError("Authorization header is required", 401);
    }
  }

  async isSystemAdmin() {
    const { data, error } = await this.context.supabase.rpc("is_system_admin");

    if (error) {
      this.throwError("Error getting system admin", error, 500);
    }

    return data;
  }

  async getUser() {
    this.getToken();

    const { data, error } = await this.context.supabase.auth.getUser(
      this.token
    );

    if (error) {
      this.throwError("Error getting user", error, 500);
    }

    return data;
  }

  async getUserTenantAndRoles() {
    const user = await this.getUser();

    const { data: tenantUser } = await this.context.supabase_AS_SUPER_ADMIN
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.user.id)
      .single();

    const tenantId = tenantUser.tenant_id;

    const { data: roles, error: rolesError } =
      await this.context.supabase_AS_SUPER_ADMIN
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

    if (!roles.some((role) => this.roles?.includes(role))) {
      this.noPrivileges();
    }
  }
}

export { ROLES, AuthService };
