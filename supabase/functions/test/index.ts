import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";

const handler = async (req: Request, context: AuthenticatedContext) => {
  return {
    body: JSON.stringify(context.authService.user),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
};

serve(
  withErrorBoundary(
    withAuthenticatedContext(
      withOriginGuardedRequestHandler<AuthenticatedContext>([
        "http://localhost:3000",
      ])(handler)
    )
  )
);
