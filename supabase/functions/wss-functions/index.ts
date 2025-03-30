// NO_CHANGE

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { withAuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { withRequestHandlers } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import type { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { withCors } from "locals/middleware/withCors";
import { AgentController } from "locals/controllers/AgentController";
import { FunctionController } from "locals/controllers/FunctionController";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { conversation_id, agent_id, function_call } = await req.json();

  const agentController = await AgentController.create({
    context,
    functionController: new FunctionController(context),
    agentId: agent_id,
    sessionContext: {},
  });

  await agentController.functionController.getFunctions();

  const { result } = await agentController.functionController.executeFunction(
    function_call
  );

  return {
    body: JSON.stringify(result),
    headers: {
      "Content-Type": "application/json",
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
