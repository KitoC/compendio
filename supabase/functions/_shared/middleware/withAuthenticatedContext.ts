import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "locals/services/AuthService";
import {
  SharedServices,
  getSharedServices,
} from "locals/middleware/_getSharedServices";

export interface AuthenticatedContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
}

export const withAuthenticatedContext = (
  handler: (req: Request, context: AuthenticatedContext) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const supabaseContext = {
      supabase,
      supabase_AS_SUPER_ADMIN,
    };

    const authService = new AuthService(req, supabaseContext);

    await authService.initialize();
    await authService.getUser();

    const context = {
      ...supabaseContext,
      authService,
      ...getSharedServices(req, supabaseContext),
    };

    return handler(req, context);
  };
};
