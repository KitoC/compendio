import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRequestHandlers } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { OAuthController } from "locals/controllers/OAuthController";
import { WebhookController } from "locals/controllers/WebhookController";
import {
  withPublicContext,
  PublicContext,
} from "locals/middleware/withPublicContext";
import { withCors } from "locals/middleware/withCors";

const handler = async (req: Request, context: PublicContext) => {
  const oauthController = new OAuthController(context);
  const webhookController = new WebhookController(context, oauthController);

  const subscriptionJson =
    await webhookController.refreshWebhookSubscriptions();

  return {
    body: JSON.stringify({ success: true, subscriptionJson }),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
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
