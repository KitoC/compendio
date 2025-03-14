
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use a newer version of the Supabase client that's compatible with Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return new Response("Prompt is required", { status: 400 });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    }
  );

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    return new Response(`OpenAI API error: ${errorText}`, {
      status: openaiResponse.status,
      headers: corsHeaders,
    });
  }

  const reader = openaiResponse.body?.getReader();
  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        const { done, value } = await reader!.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
        push();
      };
      push();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
});
