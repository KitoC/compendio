// NO_CHANGE

// @ts-expect-error - Supabase client is not typed
import { createClient, SupabaseClient } from "supabase-js";
import type Logger from "../utils/logger";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "RequestError";
  }
}

interface IConstructorParams {
  logger: Logger;
}

// edge-function.ts

class SupabaseService {
  private _supabase: SupabaseClient;
  private _supabase_SERVICE_ROLE: SupabaseClient | null;
  private authHeader: string | null;
  private logger: Logger;
  private token: string | null;
  constructor({ logger }: IConstructorParams) {
    this.logger = logger;
    this.authHeader = null;
    this.token = null;
    this._supabase_SERVICE_ROLE = null;
  }

  async getUser() {
    if (!this._supabase) {
      throw new RequestError("Supabase client not initialized", 500);
    }

    const { data, error } = await this._supabase.auth.getUser(this.token);

    if (error) {
      this.logger.error("Error getting user", error);
      throw new RequestError("Error getting user", 500, error);
    }

    return data;
  }

  async getAuthorizedUserAndTenantId(req: Request) {
    this.checkAuthHeaderPresent(req);

    if (!this._supabase) {
      throw new RequestError("Supabase client not initialized", 500);
    }

    const { data, error } = await this._supabase.auth.getUser(this.token);

    const { data: tenantUser } = await this._supabase_SERVICE_ROLE
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", data.user.id)
      .single();
    const tenantId = tenantUser.tenant_id;
    const { data: roles } = await this._supabase_SERVICE_ROLE
      .from("user_roles")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("tenant_id", tenantId);

    if (error) {
      this.logger.error("Error getting user", error);
      throw new RequestError("Error getting user", 500, error);
    }

    return {
      user: data.user,
      tenantId: tenantUser.tenant_id,
      roles,
    };
  }

  get supabase() {
    return this._supabase;
  }

  get supabase_AS_SUPER_ADMIN() {
    return this._supabase_SERVICE_ROLE;
  }

  initializeSupabase({
    url,
    key,
    serviceRoleKey,
  }: {
    url: string;
    key: string;
    serviceRoleKey?: string;
  }) {
    this._supabase = createClient(url, key, {
      global: { headers: { Authorization: this.authHeader } },
    });

    if (serviceRoleKey) {
      this._supabase_SERVICE_ROLE = createClient(url, serviceRoleKey);
    }
  }

  checkAuthHeaderPresent(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    this.authHeader = authHeader;
    this.token = token || null;

    // Extract the Authorization header
    if (!authHeader) {
      const message = "Authorization header is required";
      this.logger.error(message);
      throw new RequestError(message, 401);
    }
  }

  sendPreflightResponse() {
    return new Response(null, { headers: corsHeaders });
  }

  sendJsonResponse(data: object, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendError(message: string, status: number = 500, error?: Error) {
    this.logger.error(message, error);

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
}

export default SupabaseService;
