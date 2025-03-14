import Deno from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://js.supabase.io/v1.0.0/supabase.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req: Request) => {
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
    headers: { "Content-Type": "text/event-stream" },
  });
});
