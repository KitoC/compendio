import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import {
  SharedServices,
  getSharedServices,
} from "locals/middleware/_getSharedServices";
import { AuthService } from "locals/services/AuthService";
import { CorsContext } from "locals/middleware/withCors";
export interface PublicContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
}

export type PublicContextChildHandler = (
  req: Request,
  context: PublicContext
) => Promise<Response>;

export const withPublicContext = (
  handler: PublicContextChildHandler,
  options: {
    RUN_AS_SUPER_ADMIN?: boolean;
  } = {}
) => {
  return async (req: Request, corsContext: CorsContext): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const supabaseContext = {
      supabase,
      supabase_AS_SUPER_ADMIN,
      RUN_AS_SUPER_ADMIN: options.RUN_AS_SUPER_ADMIN,
    };

    const authService = new AuthService(req, supabaseContext);

    // await authService.initialize();
    // await authService.getUser();

    const context = {
      ...corsContext,
      ...supabaseContext,
      authService,
      ...getSharedServices(req, supabaseContext),
    };

    return handler(req, context);
  };
};
