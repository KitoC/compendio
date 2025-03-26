import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { AuthService } from "locals/services/AuthService";
import { CredentialsService } from "locals/services/CredentialsService";
import { ConnectedServicesService } from "locals/services/ConnectedServicesService";

export type AuthenticatedContext = {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
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
    const connectedServicesService = new ConnectedServicesService(
      req,
      supabaseContext
    );

    await authService.initialize();
    await authService.getUser();

    const context = {
      ...supabaseContext,
      authService,
      credentialsService,
      connectedServicesService,
    };

    return handler(req, context);
  };
};
