import { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withAuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { withCors } from "@/middleware/withCors";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getEnvKey } from "@/utils/env";

const OPENAI_API_KEY = getEnvKey("OPENAI_API_KEY");

const handler = async (req: Request, context: AuthenticatedContext) => {
  try {
    const options = await req.json();

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview",
          input_audio_transcription: {
            language: "en",
            model: "gpt-4o-mini-transcribe",
          },
          ...options,
        }),
      }
    );

    const data = await response.json();
    console.log("data", data);

    // In production, mint a short-lived token if OpenAI supports it.
    // For now, return the API key (not secure for production).
    return new Response(JSON.stringify(data), {
      headers: { ...context.corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      {
        headers: { ...context.corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
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
