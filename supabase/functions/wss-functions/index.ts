// NO_CHANGE

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import "https://deno.land/x/xhr@0.1.0/mod.ts";
// import { getEnvKey } from "../_deprecated/shared/utils/env.ts";
// import OpenAIService from "../_deprecated/shared/services/OpenAIService.ts";
// import AgentController from "../_deprecated/controllers/AgentController.ts";
// import ConversationsController from "../_deprecated/controllers/ConversationsController.ts";
// import SupabaseService from "../_deprecated/shared/services/SupabaseService.ts";
// import FunctionController from "../_deprecated/controllers/FunctionController.ts";
// import Logger from "../_deprecated/shared/utils/logger.ts";

// // Environment variables
// const supabaseUrl = getEnvKey("SUPABASE_URL");
// const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

// const logger = new Logger({ debug: getEnvKey("DEBUG") });
// const openAiService = new OpenAIService({
//   apiKey: getEnvKey("OPENAI_API_KEY"),
//   logger,
// });
// const agentController = new AgentController({ logger });
// const conversationsController = new ConversationsController({ logger });
// const supabaseService = new SupabaseService({ logger });
// const functionController = new FunctionController({ logger });

// /**
//  * Main handler for the AI chat edge function
//  */
// serve(async (req: Request) => {
//   // Handle CORS preflight requests
//   if (req.method === "OPTIONS") {
//     return supabaseService.sendPreflightResponse();
//   }

//   try {
//     const { conversation_id, agent_id, function_call } = await req.json();

//     supabaseService.checkAuthHeaderPresent(req);

//     supabaseService.initializeSupabase({
//       url: supabaseUrl,
//       key: supabaseAnonKey,
//     });

//     // Initialize Supabase client with the user's JWT

//     await conversationsController.setDependencies({
//       supabase: supabaseService.supabase,
//     });

//     await functionController.setDependencies({
//       supabaseService,
//     });
//     await agentController.setDependenciesAndGetAgents({
//       supabaseService,
//       openAiService,
//       functionController,
//     });

//     await functionController.getFunctions();

//     const response = await functionController.executeFunction(function_call);

//     return supabaseService.sendJsonResponse(
//       response || { message: "No response from function" },
//       200
//     );
//   } catch (error) {
//     console.error("Error in AI chat function:", error);

//     return supabaseService.sendJsonResponse(
//       { error: error.message || "An unknown error occurred" },
//       error.status
//     );
//   }
// });

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
