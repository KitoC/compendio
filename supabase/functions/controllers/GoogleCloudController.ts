// NO_CHANGE

import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

class GoogleCloudController {
  private supabase: SupabaseClient | null;
  private apiKey: string;
  constructor({ apiKey }: { apiKey: string }) {
    this.supabase = null;
    this.apiKey = apiKey;
  }

  async setDependencies({ supabase }: { supabase: SupabaseClient }) {
    this.supabase = supabase;
  }

  async generateSpeech(text: string) {
    if (!this.apiKey) {
      throw new Error("GOOGLE_CLOUD_API_KEY is not set");
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // TODO: MAKE CONFIGURABLE
        body: JSON.stringify({
          audioConfig: {
            audioEncoding: "LINEAR16",
            effectsProfileId: ["small-bluetooth-speaker-class-device"],
            pitch: 0,
            speakingRate: 1.2,
          },
          input: { text },
          voice: { languageCode: "en-AU", name: "en-AU-Chirp3-HD-Puck" },
        }),
      }
    );

    return response;
  }
}

export default GoogleCloudController;
