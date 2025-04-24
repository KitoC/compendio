import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  RequestHandlerResponse,
  withRequestHandlers,
} from "@/middleware/withRequestHandlers";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";

import {
  withPublicContext,
  PublicContext,
} from "@/middleware/withPublicContext";
import { WebhookEventHandler } from "@/handlers/WebhookEventHandler";
import { withCors } from "@/middleware/withCors";

const handler = async (
  req: Request,
  context: PublicContext
): Promise<RequestHandlerResponse> => {
  return new WebhookEventHandler().handle(req, context);
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
