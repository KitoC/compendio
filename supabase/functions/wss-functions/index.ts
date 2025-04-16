// NO_CHANGE

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
  const { conversation_id, agent_id, function_call, payload } =
    await req.json();

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

  return new Response(JSON.stringify(result), {
    headers: {
      ...context.corsHeaders,
      "Content-Type": "application/json",
    },
    status: 200,
  });
};

serve(withCors()(withErrorBoundary(withAuthenticatedContext(handler))));
