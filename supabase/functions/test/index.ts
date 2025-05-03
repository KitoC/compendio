import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { baserowService } = context;

  console.log("baserowService -->", baserowService);
  const tables = await baserowService.getSchema();

  return {
    body: JSON.stringify({ success: true, tables }),
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
