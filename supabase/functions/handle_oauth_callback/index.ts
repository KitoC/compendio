// supabase/functions/handle_oauth_callback.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OAuthController } from "locals/controllers/OAuthController";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import {
  withPublicContext,
  PublicContext,
} from "locals/middleware/withPublicContext";

const handleOauthCallbackHandler = async (
  req: Request,
  context: PublicContext
) => {
  const oauthController = new OAuthController(context);

  const { code, state, id_token_only, options } = await req.json();

  if (!code || !state) {
    return oauthController.throwError("Missing code or state", 400);
  }

  if (id_token_only) {
    const id_token = await oauthController.getOAuthIdToken({
      code,
      state,
      options,
    });

    return {
      body: JSON.stringify({ success: true, id_token }),
      headers: { "Content-Type": "application/json" },
      status: 200,
    };
  }

  const credential_id = await oauthController.getTokenAndCreateCredential({
    code,
    state,
    options,
  });

  return {
    body: JSON.stringify({ success: true, credential_id }),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
};

serve(
  withErrorBoundary(
    withPublicContext(
      withOriginGuardedRequestHandler<PublicContext>({
        corsHeaders: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      })(handleOauthCallbackHandler)
    )
  )
);
