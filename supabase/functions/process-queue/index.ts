import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";

import {
  withPublicContext,
  PublicContext,
} from "locals/middleware/withPublicContext";
import { getEnvKey } from "locals/utils/env";
import { ProcessQueueHandler } from "locals/handlers/ProcessQueueHandler";

const handler = async (req: Request, context: PublicContext) => {
  const processQueueHandler = new ProcessQueueHandler();

  await processQueueHandler.handle(req, context);

  return {
    body: null,
    headers: { "Content-Type": "text/plain" },
    status: 202,
  };
};

serve(
  withErrorBoundary(
    withPublicContext(
      withOriginGuardedRequestHandler<PublicContext>()(handler),
      { RUN_AS_SUPER_ADMIN: true }
    )
  )
);
