import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { CredentialsService } from "locals/services/CredentialsService";
import { ConnectedServicesService } from "locals/services/ConnectedServicesService";
export type PublicContext = {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
};

export const withPublicContext = (
  handler: (req: Request, context: PublicContext) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const supabaseContext = {
      supabase,
      supabase_AS_SUPER_ADMIN,
    };

    const credentialsService = new CredentialsService(req, supabaseContext);
    const connectedServicesService = new ConnectedServicesService(
      req,
      supabaseContext
    );

    const context = {
      ...supabaseContext,
      credentialsService,
      connectedServicesService,
    };

    return handler(req, context);
  };
};
