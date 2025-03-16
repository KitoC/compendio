import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPEN_AI_URL = "https://api.openai.com";

const ENDPOINTS = {
  COMPLETIONS: `${OPEN_AI_URL}/v1/chat/completions`,
};

class OpenAIService {
  private apiKey: string;
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async callOpenAIChatCompletion({
    messages,
    model = "gpt-4o-mini",
    stream = true,
    options = {},
  }) {
    try {
      const response = await fetch(ENDPOINTS.COMPLETIONS, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ model, messages, stream, ...options }),
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
  processStreamChunk(chunk) {
    const text = new TextDecoder().decode(chunk);
    const processedContent = [];

    // Split the text into lines
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      // Each line starts with "data: " - remove that prefix
      if (line.startsWith("data: ")) {
        const data = line.substring(6);

        // Check if it's the end of the stream
        if (data === "[DONE]") {
          continue;
        }

        try {
          // Parse the JSON data
          const parsed = JSON.parse(data);

          // Extract just the content from the response
          if (
            parsed.choices &&
            parsed.choices[0] &&
            parsed.choices[0].delta &&
            parsed.choices[0].delta.content
          ) {
            // Send just the content
            // @ts-ignore
            processedContent.push(parsed.choices[0].delta.content);
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
          // If there's an error, just send the raw data
          // @ts-ignore
          processedContent.push(data);
        }
      } else {
        // Just in case there's other data
        // @ts-ignore
        processedContent.push(line);
      }
    }

    return processedContent.map((content) => new TextEncoder().encode(content));
  }
}

export default OpenAIService;
