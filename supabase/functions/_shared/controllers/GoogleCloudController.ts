// NO_CHANGE

import "https://deno.land/x/xhr@0.1.0/mod.ts";

class GoogleCloudController {
  private apiKey: string;
  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
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
