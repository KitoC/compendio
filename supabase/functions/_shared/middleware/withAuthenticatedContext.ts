// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "@/services/AuthService";
import { SharedServices } from "@/middleware/_getSharedServices";
import { CorsContext } from "@/middleware/withCors";
import { getAuthenticatedContext } from "@/middleware/_getAuthenticatedContext";
import type { User } from "@/types/user";
import { AirtableService } from "@/services/providers/AirtableService";
import { BaserowService } from "@/services/providers/BaserowService";
import type { Database } from "@/integrations/supabase/types";
import { CustomTableService } from "@/services/CustomTableService";
type TenantWorkspace = Database["public"]["Tables"]["tenants"]["Row"];

export interface AuthenticatedContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
  tenant_id?: string | null;
  user: User;
  airtableService: AirtableService;
  baserowService: BaserowService;
  tenantWorkspace: TenantWorkspace;
  customTableService: CustomTableService;
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
