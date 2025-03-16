import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getEnvKey } from "../shared/utils/env.ts";
import OpenAIService from "../shared/services/OpenAIService.ts";
import AgentController from "../controllers/AgentController.ts";
import ConversationsController from "../controllers/ConversationsController.ts";
import SupabaseService from "../shared/services/SupabaseService.ts";
import FunctionController from "../controllers/FunctionController.ts";
// Environment variables
const supabaseUrl = getEnvKey("SUPABASE_URL");
const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

const openAiService = new OpenAIService(getEnvKey("OPENAI_API_KEY"));
const agentController = new AgentController();
const conversationsController = new ConversationsController();
const supabaseService = new SupabaseService();
const functionController = new FunctionController();

/**
 * Main handler for the AI chat edge function
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return supabaseService.sendPreflightResponse();
  }

  try {
    const { conversation_id, agent_id, messages, function_call } =
      await req.json();

    // supabaseService.checkAuthHeaderPresent(req);

    // supabaseService.initializeSupabase({
    //   url: supabaseUrl,
    //   key: supabaseAnonKey,
    // });

    // // Initialize Supabase client with the user's JWT

    // await conversationsController.setDependencies({
    //   supabase: supabaseService.supabase,
    // });

    // await functionController.setDependencies({
    //   supabaseService,
    // });
    // await agentController.setDependenciesAndGetAgents({
    //   supabaseService,
    //   openAiService,
    //   functionController,
    // });

    // // Validate conversation exists or create it
    // await conversationsController.validateOrCreateConversation(conversation_id);

    const message = {
      type: "message",
      message: "",
      function_call,
    };

    return supabaseService.sendJsonResponse(message, 200);
  } catch (error) {
    console.error("Error in AI chat function:", error);

    return supabaseService.sendJsonResponse(
      { error: error.message || "An unknown error occurred" },
      error.status
    );
  }
});
