// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "locals/services/AuthService";
import { SharedServices } from "locals/middleware/_getSharedServices";
import { CorsContext } from "locals/middleware/withCors";
import { getAuthenticatedContext } from "locals/middleware/_getAuthenticatedContext";
import type { User } from "@/types/user";

export interface AuthenticatedContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
  tenant_id?: string | null;
  user: User;
}

export type AuthenticatedContextChildHandler = (
  req: Request,
  context: AuthenticatedContext
) => Promise<Response>;

export const withAuthenticatedContext = (
  handler: AuthenticatedContextChildHandler
) => {
  return async (req: Request, corsContext: CorsContext): Promise<Response> => {
    const Authorization = req.headers.get("Authorization");
    const tenantId = req.headers.get("x-tenant-id");

    const authenticatedContext = await getAuthenticatedContext(
      Authorization,
      tenantId
    );

    const context = {
      ...corsContext,
      ...authenticatedContext,
    };

    return handler(req, context);
  };
};
