import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "locals/services/AuthService";
import {
  getSharedServices,
  SharedServices,
} from "locals/middleware/_getSharedServices";
import { CorsContext } from "locals/middleware/withCors";
import Logger from "locals/utils/Logger";

const logger = new Logger({ name: "withAuthenticatedContext" });

export interface AuthenticatedContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
}

export type AuthenticatedContextChildHandler = (
  req: Request,
  context: AuthenticatedContext
) => Promise<Response>;

export const withAuthenticatedContext = (
  handler: AuthenticatedContextChildHandler
) => {
  return async (req: Request, corsContext: CorsContext): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const supabaseContext = {
      supabase,
      supabase_AS_SUPER_ADMIN,
    };

    const authService = new AuthService(req, supabaseContext);

    await authService.initialize();
    const user = await authService.getUser();

    logger.debug("currentUser", user?.user?.id);
    logger.debug("authService.tenantId", authService.tenantId);

    const context = {
      ...corsContext,
      ...supabaseContext,
      authService,
      user,
      tenant_id: authService.tenantId,
      ...getSharedServices(req, supabaseContext),
    };

    return handler(req, context);
  };
};
