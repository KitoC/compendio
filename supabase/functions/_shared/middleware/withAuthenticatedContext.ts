import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "locals/services/AuthService";
import { CredentialsService } from "locals/services/CredentialsService";

export type AuthenticatedContext = {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
  credentialsService: CredentialsService;
};

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
    const credentialsService = new CredentialsService(req, supabaseContext);
    await authService.initialize();

    const context = {
      ...supabaseContext,
      authService,
      credentialsService,
    };

    return handler(req, context);
  };
};
