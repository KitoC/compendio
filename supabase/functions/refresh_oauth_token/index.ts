import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { OAuthController } from "@/controllers/OAuthController";
import { PublicContext } from "@/middleware/withPublicContext";
import { ICredential } from "@/services/CredentialsService";
import { withPublicContext } from "@/middleware/withPublicContext";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: PublicContext) => {
  const { credentialId } = await req.json();

  const oAuthController = new OAuthController(context);

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
  withCors()(
    withErrorBoundary(
      withPublicContext(withRequestHandlers<PublicContext>(handler), {
        RUN_AS_SUPER_ADMIN: true,
      })
    )
  )
);
