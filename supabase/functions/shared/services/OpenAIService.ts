import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPEN_AI_URL = "https://api.openai.com";

const ENDPOINTS = {
  COMPLETIONS: `${OPEN_AI_URL}/v1/chat/completions`,
};

class OpenAIService {
  private apiKey: string;
  private headers: Record<string, string>;
  private self = this; // Assign this for use in event handlers

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
    functions = undefined,
    options = {},
  }) {
    try {
      const response = await fetch(ENDPOINTS.COMPLETIONS, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          model,
          messages,
          stream,
          functions,
          ...options,
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
   * Processes OpenAI streaming chunk into text content and detects function calls
   */
  processStreamChunk(chunk: Uint8Array): {
    content: string;
    functionCall: any | null;
  } {
    const text = new TextDecoder().decode(chunk);
    let content = "";
    let functionCall: any | null = null;

    const lines = text.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.substring(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const choice = parsed?.choices?.[0];

          if (choice?.delta?.content) {
            content += choice.delta.content;
          }

          if (choice?.delta?.function_call) {
            if (!functionCall) {
              functionCall = {
                name: choice.delta.function_call.name,
                arguments: choice.delta.function_call.arguments
                  ? JSON.parse(choice.delta.function_call.arguments)
                  : {},
              };
            }
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
          content += data;
        }
      }
    }
    return { content, functionCall };
  }

  /**
   * Handles streaming and function execution
   */
  async streamAndCallFunction({
    requestArgs,
    onFunctionCall,
  }: {
    requestArgs: {
      messages: any;
      model?: string;
      stream?: boolean;
      functions?: any;
    };
    onFunctionCall: (fn: { name: string; arguments: any }) => Promise<any>;
  }): Promise<ReadableStream<Uint8Array>> {
    const self = this; // Assign self reference
    const response = await self.callOpenAIChatCompletion(requestArgs);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    return new ReadableStream({
      async start(controller) {
        let functionCallDetected: { name: string; arguments: any } | null =
          null;
        let functionResult: any = null;

        // First streaming pass (read initial response)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const { content, functionCall } = self.processStreamChunk(value);

          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }

          if (functionCall && !functionCallDetected) {
            functionCallDetected = functionCall;
            break;
          }
        }

        // If no function was detected, close the stream
        if (!functionCallDetected) {
          controller.close();
          return;
        }

        console.log("🔹 Function call detected:", functionCallDetected);
        functionResult = onFunctionCall(functionCallDetected);

        if (!functionResult) {
          console.error("⚠️ Function execution returned null!");
          controller.close();
          return;
        }

        console.log("🔹 Function result --> ", functionResult);
        // Append function response as a new message
        const updatedMessages = [
          ...requestArgs.messages,
          { role: "assistant", content: "" },
          {
            role: "function",
            name: functionCallDetected.name,
            content: JSON.stringify(functionResult),
          },
        ];

        console.log("🔹 Resuming stream with function response...");

        // Call OpenAI again with updated messages
        const resumedResponse = await self.callOpenAIChatCompletion({
          messages: updatedMessages,
          model: requestArgs.model,
          stream: true,
        });

        const resumedReader = resumedResponse.body?.getReader();
        if (!resumedReader) {
          controller.error(new Error("Failed to get resumed response reader"));
          return;
        }

        // Stream resumed response
        while (true) {
          const { done, value } = await resumedReader.read();
          if (done) break;

          const { content, functionCall } = self.processStreamChunk(value);

          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }

        controller.close();
      },
    });
  }
}

export default OpenAIService;
