// NO_CHANGE

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getEnvKey } from "@/utils/env";
import Logger from "@/utils/Logger";
import GoogleCloudController from "@/controllers/GoogleCloudController";
import {
  AuthenticatedContext,
  withAuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withCors } from "@/middleware/withCors";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";

// functions/v1/tts
const handler = async (req: Request, context: AuthenticatedContext) => {
  const { message } = await req.json();

  const logger = new Logger({ name: "tts" });

  const googleCloudController = new GoogleCloudController({
    apiKey: getEnvKey("GOOGLE_CLOUD_API_KEY"),
  });

  // Generate speech from text if Google Cloud API key is available
  let audioContent = null;

  try {
    const ttsResponse = await googleCloudController.generateSpeech(message);

    if (ttsResponse.ok) {
      const ttsData = await ttsResponse.json();
      audioContent = ttsData.audioContent; // Already in base64 format
    } else {
      console.error("Google Cloud TTS API error:", await ttsResponse.text());
    }
  } catch (error) {
    console.error("Error generating speech:", error);
  }

  return {
    body: JSON.stringify({ audioContent }),
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
