
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getEnvKey } from "../shared/utils/env.ts";
import OpenAIService from "../shared/services/OpenAIService.ts";
import SupabaseService from "../shared/services/SupabaseService.ts";

// Environment variables
const GOOGLE_CLOUD_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
const supabaseUrl = getEnvKey("SUPABASE_URL");
const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

const openAiService = new OpenAIService(getEnvKey("OPENAI_API_KEY"));
const supabaseService = new SupabaseService();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { message, agent_id, tenant_id, user_id, voice_config } = await req.json();

    // Basic validation
    if (!message) {
      return supabaseService.sendJsonResponse(
        { error: "Message is required" },
        400
      );
    }

    if (!agent_id) {
      return supabaseService.sendJsonResponse(
        { error: "Agent ID is required" },
        400
      );
    }

    supabaseService.checkAuthHeaderPresent(req);

    supabaseService.initializeSupabase({
      url: supabaseUrl,
      key: supabaseAnonKey,
    });

    // Fetch agent details
    const { data: agent, error: agentError } = await supabaseService.supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agent_id)
      .single();

    if (agentError || !agent) {
      return supabaseService.sendJsonResponse(
        { error: "Agent not found" },
        404
      );
    }

    // Get agent system prompt
    const systemPrompt = agent.prompt || "You are a helpful AI assistant.";

    // Call OpenAI for text response
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getEnvKey("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const textResponse = data.choices[0].message.content;

    // Store the conversation in the database
    await supabaseService.supabase.from("messages").insert([
      {
        role: "user",
        content: { text: message },
        conversation_id: agent_id, // Using agent_id as conversation_id for simplicity
        metadata: {},
        user_id,
        tenant_id,
      },
      {
        role: "assistant",
        content: { text: textResponse },
        conversation_id: agent_id,
        metadata: {},
        user_id,
        tenant_id,
      },
    ]);

    // Generate speech from text if Google Cloud API key is available
    let audioContent = null;
    if (GOOGLE_CLOUD_API_KEY) {
      try {
        // Configure Google Cloud TTS
        const { languageCode = "en-US", name = "en-US-Standard-C", ssmlGender = "FEMALE" } = voice_config || {};
        
        const ttsResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: { text: textResponse },
              voice: {
                languageCode,
                name,
                ssmlGender,
              },
              audioConfig: {
                audioEncoding: "MP3",
              },
            }),
          }
        );

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioContent = ttsData.audioContent; // Already in base64 format
        } else {
          console.error(
            "Google Cloud TTS API error:",
            await ttsResponse.text()
          );
        }
      } catch (error) {
        console.error("Error generating speech:", error);
      }
    }

    // Return both text and audio
    return supabaseService.sendJsonResponse({
      text: textResponse,
      audioContent,
    });
  } catch (error) {
    console.error("Error in voice-chat function:", error);
    return supabaseService.sendJsonResponse(
      { error: error.message || "An unknown error occurred" },
      error.status || 500
    );
  }
});
