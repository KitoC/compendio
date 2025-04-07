import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withRequestHandlers } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { withCors } from "locals/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { tenant_id, user_id, credential_name, access_token, provider } =
    await req.json();

  const credential =
    await context.credentialsService.createAccessTokenCredential({
      tenant_id,
      user_id,
      credential_name,
      access_token,
      provider,
    });

  return {
    body: JSON.stringify({ credential }),
    headers: { "Content-Type": "application/json" },
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
