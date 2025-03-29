import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRequestHandlers } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";

import {
  withPublicContext,
  PublicContext,
} from "locals/middleware/withPublicContext";
import { getEnvKey } from "locals/utils/env";
import { ProcessQueueHandler } from "locals/handlers/ProcessQueueHandler";
import { withCors } from "locals/middleware/withCors";

const handler = async (req: Request, context: PublicContext) => {
  const processQueueHandler = new ProcessQueueHandler(context);

  const result = await processQueueHandler.handle(req, context);

  return {
    body: JSON.stringify(result),
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
