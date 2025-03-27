import { getClient, getADMINClient } from "locals/db";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import {
  SharedServices,
  getSharedServices,
} from "locals/middleware/_getSharedServices";

export interface PublicContext extends SharedServices {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
}

export const withPublicContext = (
  handler: (req: Request, context: PublicContext) => Promise<Response>,
  options: {
    RUN_AS_SUPER_ADMIN?: boolean;
  } = {}
) => {
  return async (req: Request): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const supabaseContext = {
      supabase,
      supabase_AS_SUPER_ADMIN,
      RUN_AS_SUPER_ADMIN: options.RUN_AS_SUPER_ADMIN,
    };

    const context = {
      ...supabaseContext,
      ...getSharedServices(req, supabaseContext),
    };

    return handler(req, context);
  };
};
