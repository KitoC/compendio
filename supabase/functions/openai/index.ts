import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { withAuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import type { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const body = await req.json();

  const result = await context.openAiService.callOpenAIChatCompletion(body);

  return {
    body: JSON.stringify(result),
    headers: {
      ...context.corsHeaders,
      "Content-Type": body.stream ? "text/event-stream" : "application/json",
    },
    status: 200,
  };
};

serve(
  withCors()(
    withErrorBoundary(
      withAuthenticatedContext(
        withRequestHandlers<AuthenticatedContext>(handler)
      )
    )
  )
);
