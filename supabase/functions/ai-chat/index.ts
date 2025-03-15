
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Initializes Supabase client with user's JWT
 */
function initializeSupabaseClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

/**
 * Validates the conversation or creates it if it doesn't exist
 */
async function validateOrCreateConversation(supabase, conversationId: string) {
  try {
    // Check if the conversation exists
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
    
    if (conversationError && conversationError.code === "PGRST116") {
      // PGRST116 means no rows returned - conversation doesn't exist
      // Get the user's ID from their JWT
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Failed to get user: ${userError.message}`);
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Create a new conversation
      const { error: createError } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          user_id: userId,
          title: "New Conversation",
          domain: "default",
        });
      
      if (createError) {
        throw new Error(`Failed to create conversation: ${createError.message}`);
      }
    } else if (conversationError) {
      throw new Error(`Failed to check conversation: ${conversationError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error in validateOrCreateConversation:", error);
    throw error;
  }
}

/**
 * Calls OpenAI API and returns the streaming response
 */
async function callOpenAI(messages, model) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * Processes a chunk of streaming data from OpenAI
 */
function processStreamChunk(chunk) {
  const text = new TextDecoder().decode(chunk);
  const processedContent = [];
  
  // Split the text into lines
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  for (const line of lines) {
    // Each line starts with "data: " - remove that prefix
    if (line.startsWith('data: ')) {
      const data = line.substring(6);
      
      // Check if it's the end of the stream
      if (data === '[DONE]') {
        continue;
      }
      
      try {
        // Parse the JSON data
        const parsed = JSON.parse(data);
        
        // Extract just the content from the response
        if (parsed.choices && 
            parsed.choices[0] && 
            parsed.choices[0].delta && 
            parsed.choices[0].delta.content) {
          // Send just the content
          processedContent.push(parsed.choices[0].delta.content);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
        // If there's an error, just send the raw data
        processedContent.push(data);
      }
    } else {
      // Just in case there's other data
      processedContent.push(line);
    }
  }
  
  return processedContent.map(content => new TextEncoder().encode(content));
}

/**
 * Main handler for the AI chat edge function
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { conversation_id, messages, model = "gpt-4o-mini" } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Supabase client with the user's JWT
    const supabase = initializeSupabaseClient(authHeader);
    
    // Validate conversation exists or create it
    if (conversation_id) {
      try {
        await validateOrCreateConversation(supabase, conversation_id);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Call OpenAI API
    let openaiResponse;
    try {
      openaiResponse = await callOpenAI(messages, model);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.error(new Error("Failed to get response reader"));
          return;
        }
        
        const pump = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            
            // Process the chunk
            const processedChunks = processStreamChunk(value);
            
            // Send each processed chunk to the client
            for (const chunk of processedChunks) {
              controller.enqueue(chunk);
            }
            
            // Continue pumping
            pump();
          } catch (error) {
            console.error("Error processing stream:", error);
            controller.error(error);
          }
        };
        
        await pump();
      }
    });
    
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in AI chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
