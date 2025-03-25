import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { OAuthController } from "locals/controllers/OAuthController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { ICredential } from "locals/services/CredentialsService";
import { withPublicContext } from "locals/middleware/withPublicContext";

const handler = async (req: Request, context: PublicContext) => {
  const { credentialId } = await req.json();

  const oAuthController = new OAuthController(req, context);

  await context.supabase_AS_SUPER_ADMIN.rpc("cleanup_oauth_states");

  if (credentialId) {
    const credential = await context.credentialsService.getCredential(
      credentialId
    );

    await oAuthController.refreshOauthCredential(credential);

    return {
      body: JSON.stringify({ credentialId, success: true }),
      headers: { "Content-Type": "application/json" },
      status: 200,
    };
  } else {
    const credentials =
      await context.credentialsService.getExpiredCredentials();

    await Promise.all(
      credentials.map(async (credential: ICredential) => {
        await oAuthController.refreshOauthCredential(credential);
      })
    );

    return {
      body: "Token refresh cron job completed",
      headers: { "Content-Type": "application/text" },
      status: 200,
    };
  }
};

serve(
  withErrorBoundary(
    withPublicContext(withOriginGuardedRequestHandler<PublicContext>()(handler))
  )
);
