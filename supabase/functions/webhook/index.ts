import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { OAuthController } from "locals/controllers/OAuthController";
import { WebhookController } from "locals/controllers/WebhookController";

import {
  withPublicContext,
  PublicContext,
} from "locals/middleware/withPublicContext";

const handler = async (req: Request, context: PublicContext) => {
  const url = new URL(req.url);

  // 1. Handle GET validation (standard)
  const rawToken = url.searchParams.get("validationToken");
  const connected_service_id = url.searchParams.get("connected_service_id");
  const tenant_id = url.searchParams.get("tenant_id");

  if (rawToken) {
    const decoded = decodeURIComponent(rawToken);

    return {
      body: decoded,
      status: 200,
      headers: { "Content-Type": "text/plain" },
    };
  }

  // 2. Handle POST validation (fallback scenario)
  try {
    const body = await req.json();

    if (body?.validationToken) {
      const decoded = decodeURIComponent(body.validationToken);

      return {
        body: decoded,
        status: 200,
        headers: { "Content-Type": "text/plain" },
      };
    }

    // 3. Handle real webhook notifications
    if (body?.value) {
      console.log("📩 Received webhook event:", JSON.stringify(body, null, 2));
      return {
        body: "Webhook received",
        status: 200,
        headers: { "Content-Type": "text/plain" },
      };
    }
  } catch (e) {
    console.error("❌ Error parsing POST body:", e);
    return {
      body: "Bad Request",
      status: 400,
      headers: { "Content-Type": "text/plain" },
    };
  }

  return {
    body: "Method not allowed",
    status: 405,
    headers: { "Content-Type": "text/plain" },
  };
};

serve(
  withErrorBoundary(
    withPublicContext(withOriginGuardedRequestHandler<PublicContext>()(handler))
  )
);
