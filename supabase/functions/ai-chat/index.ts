
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    // Validate conversation exists or create it
    if (conversation_id) {
      // Check if the conversation exists
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversation_id)
        .single();
      
      if (conversationError && conversationError.code === "PGRST116") {
        // PGRST116 means no rows returned - conversation doesn't exist
        // Get the user's ID from their JWT
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "User not authenticated" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create a new conversation
        const { error: createError } = await supabase
          .from("conversations")
          .insert({
            id: conversation_id,
            user_id: userId,
            title: "New Conversation",
            domain: "default",
          });
        
        if (createError) {
          console.error("Error creating conversation:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create conversation" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (conversationError) {
        console.error("Error checking conversation:", conversationError);
        return new Response(
          JSON.stringify({ error: "Failed to check conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error (${openaiResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
        { status: openaiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process the streaming response from OpenAI
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const text = new TextDecoder().decode(chunk);
          // Split the text into lines
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            // Each line starts with "data: " - remove that prefix
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              
              // Check if it's the end of the stream
              if (data === '[DONE]') {
                return;
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
                  controller.enqueue(new TextEncoder().encode(parsed.choices[0].delta.content));
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
                // If there's an error, just send the raw data
                controller.enqueue(new TextEncoder().encode(data));
              }
            } else {
              // Just in case there's other data
              controller.enqueue(new TextEncoder().encode(line));
            }
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
          controller.error(error);
        }
      }
    });
    
    const reader = openaiResponse.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "Failed to read response body" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const stream = new ReadableStream({
      start(controller) {
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          
          // Use the transform stream to process the chunk
          const processedChunk = await new Response(
            new ReadableStream({
              start(c) {
                c.enqueue(value);
                c.close();
              }
            })
          ).arrayBuffer().then(buf => new Uint8Array(buf));
          
          const transformController = {
            enqueue: (chunk) => controller.enqueue(chunk),
            error: (err) => controller.error(err),
          };
          
          await transformStream.transformer.transform(processedChunk, transformController);
          pump();
        };
        
        pump();
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
