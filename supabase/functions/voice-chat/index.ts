// NO_CHANGE

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getEnvKey } from "../_deprecated/shared/utils/env.ts";
import OpenAIService from "../_deprecated/shared/services/OpenAIService.ts";
import SupabaseService from "../_deprecated/shared/services/SupabaseService.ts";
import Logger from "../_deprecated/shared/utils/logger.ts";
import AgentController from "../_deprecated/controllers/AgentController.ts";
import GoogleCloudController from "../_deprecated/controllers/GoogleCloudController.ts";
import FunctionController from "../_deprecated/controllers/FunctionController.ts";
import ConversationsController from "../_deprecated/controllers/ConversationsController.ts";

// Environment variables
const supabaseUrl = getEnvKey("SUPABASE_URL");
const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

const logger = new Logger({ debug: getEnvKey("DEBUG") });
const openAiService = new OpenAIService({
  apiKey: getEnvKey("OPENAI_API_KEY"),
  logger,
});
const supabaseService = new SupabaseService({ logger });
const agentController = new AgentController({ logger });
const googleCloudController = new GoogleCloudController({
  apiKey: getEnvKey("GOOGLE_CLOUD_API_KEY"),
});
const functionController = new FunctionController({ logger });
const conversationsController = new ConversationsController({ logger });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const {
      message,
      agent_id,
      tenant_id,
      user_id,
      voice_config,
      conversation_id,
    } = await req.json();

    // Basic validation
    if (!conversation_id) {
      return supabaseService.sendError("Conversation ID is required", 400);
    }

    // Basic validation
    if (!message) {
      return supabaseService.sendError("Message is required", 400);
    }

    if (!agent_id) {
      return supabaseService.sendError("Agent ID is required", 400);
    }

    supabaseService.checkAuthHeaderPresent(req);

    supabaseService.initializeSupabase({
      url: supabaseUrl,
      key: supabaseAnonKey,
    });

    await agentController.setDependenciesAndGetAgents({
      supabaseService,
      openAiService,
      functionController,
    });

    await functionController.setDependencies({
      supabaseService,
    });

    await conversationsController.setDependencies({
      supabase: supabaseService.supabase,
    });

    await googleCloudController.setDependencies({
      supabase: supabaseService.supabase,
    });

    // Call OpenAI for text response
    const { textResponse, functionCall } = await agentController.messageAgent({
      newMessage: message,
      conversationId: conversation_id,
      agentId: agent_id,
    });

    // Generate speech from text if Google Cloud API key is available
    let audioContent = null;

    try {
      const ttsResponse = await googleCloudController.generateSpeech(
        textResponse
      );

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioContent = ttsData.audioContent; // Already in base64 format
      } else {
        console.error("Google Cloud TTS API error:", await ttsResponse.text());
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }

    // Return both text and audio
    return supabaseService.sendJsonResponse(
      {
        text: textResponse,
        audioContent,
        functionCall,
      },
      200
    );
  } catch (error) {
    return supabaseService.sendError(
      error.message || "An unknown error occurred",
      error.status || 500,
      error
    );
  }
});
