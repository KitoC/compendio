import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { OAuthController } from "locals/controllers/OAuthController";
import { WebhookController } from "locals/controllers/WebhookController";
import {
  withAuthenticatedContext,
  AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { connected_service_id, tenant_id } = await req.json();

  const oauthController = new OAuthController(req, context);
  const webhookController = new WebhookController(
    req,
    context,
    oauthController
  );

  const subscriptionJson = await webhookController.subscribeToWebhook({
    connected_service_id,
    tenant_id,
  });

  return {
    body: JSON.stringify({ success: true, subscription: subscriptionJson }),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
};

serve(
  withErrorBoundary(
    withAuthenticatedContext(
      withOriginGuardedRequestHandler<AuthenticatedContext>()(handler)
    )
  )
);
