import { getClient, getADMINClient } from "locals/db";
import {
  SupabaseClient,
  // @ts-expect-error - Supabase client is not typed
} from "https://esm.sh/@supabase/supabase-js@2.8.0";

export type PublicContext = {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
};

export const withPublicContext = (
  handler: (req: Request, context: PublicContext) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const context = {
      supabase,
      supabase_AS_SUPER_ADMIN,
    };

    return handler(req, context);
  };
};
