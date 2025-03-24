import { getClient, getADMINClient } from "locals/db";
import {
  SupabaseClient,
  // @ts-expect-error - Supabase client is not typed
} from "https://esm.sh/@supabase/supabase-js@2.8.0";
import type { User } from "locals/types";
import { AuthorizationError } from "locals/error-types";
import { AuthService } from "locals/services/AuthService";

export type AuthenticatedContext = {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  authService: AuthService;
};

export const withAuthenticatedContext = (
  handler: (req: Request, context: AuthenticatedContext) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const supabase_AS_SUPER_ADMIN = getADMINClient();
    const supabase = getClient(req);

    const authService = new AuthService(req, {
      supabase,
      supabase_AS_SUPER_ADMIN,
    });

    await authService.initialize();

    const context = {
      supabase,
      supabase_AS_SUPER_ADMIN,
      authService,
    };

    return handler(req, context);
  };
};
