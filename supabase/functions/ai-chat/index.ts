import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { withAuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import type { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withCors } from "@/middleware/withCors";
import { AgentController } from "@/controllers/AgentController";
import { FunctionController } from "@/controllers/FunctionController";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { conversation_id, agent_id, messages } = await req.json();

  const agentController = await AgentController.create({
    context,
    functionController: new FunctionController(context),
    agentId: agent_id,
    sessionContext: JSON.stringify({
      todaysDate: new Date().toISOString(),
      // TODO: get user timezone from sessionContext
      timezone: "Australia/Sydney",
    }),
  });

  const result = await agentController.talkToAgent(conversation_id);

  return {
    body: result,
    headers: {
      "Content-Type": "text/event-stream",
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
