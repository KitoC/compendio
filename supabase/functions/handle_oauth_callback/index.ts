// supabase/functions/handle_oauth_callback.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RequestError } from "locals/controllers/RequestController";
import OAuthController from "locals/controllers/OAuthController";

serve(async (req: Request) => {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const { code, state, id_token_only, options } = await req.json();

    if (!code || !state) {
      return OAuthController.throwError("Missing code or state", 400);
    }

    if (id_token_only) {
      const id_token = await OAuthController.getOAuthIdToken({
        code,
        state,
        options,
      });

      return OAuthController.sendJsonResponse({ success: true, id_token }, 200);
    }

    const credential = await OAuthController.getTokenAndCreateCredential({
      code,
      state,
      options,
    });

    return OAuthController.sendJsonResponse(
      { success: true, credential_id: credential.id },
      200
    );
  } catch (err) {
    return OAuthController.sendError(err as RequestError);
  }
});
