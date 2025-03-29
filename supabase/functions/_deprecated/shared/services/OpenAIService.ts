// NO_CHANGE

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import type { OpenAiMessage, OpenAiRole } from "../../../../src/types/chat.ts";
import type {
  IFunctionCall,
  IOpenAiFunction,
} from "../../../../src/types/aiAgents.ts";
import type Logger from "../utils/logger.ts";
const OPEN_AI_URL = "https://api.openai.com";

const ENDPOINTS = {
  COMPLETIONS: `${OPEN_AI_URL}/v1/chat/completions`,
};

interface ICallOpenAIChatCompletionParams {
  messages: Partial<OpenAiMessage>[];
  model?: string;
  stream?: boolean;
  functions?: IOpenAiFunction[];
  options?: object;
}

interface IStreamMessage {
  type: string;
  text: string;
  function_call?: IFunctionCall;
}

interface IConstructorParams {
  apiKey: string;
  logger: Logger;
}

type IFunctionCallHandler = (fn: IFunctionCall) => Promise<object | undefined>;

class OpenAIService {
  private apiKey: string;
  private headers: Record<string, string>;
  private logger: Logger;

  constructor({ apiKey, logger }: IConstructorParams) {
    this.apiKey = apiKey;
    this.logger = logger;
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
  }: ICallOpenAIChatCompletionParams) {
    try {
      this.logger.info("IS STREAMING?", stream ? "YES" : "NO");

      const body = {
        model,
        messages,
        stream,
        functions: functions?.length ? functions : undefined,
        ...options,
      };

      const response = await fetch(ENDPOINTS.COMPLETIONS, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

        const error = new Error(errorText);

        this.logger.error(errorText, error);

        throw error;
      }

      return response;
    } catch (error) {
      this.logger.error(
        "Error in OpenAIService.callOpenAIChatCompletion:",
        error
      );
      throw error;
    }
  }

  /**
   * Processes OpenAI streaming chunk into text content and detects function calls
   */
  processStreamChunk(chunk: Uint8Array): {
    content: string;
    functionCall: IFunctionCall | null;
  } {
    const text = new TextDecoder().decode(chunk);
    let content = "";
    let functionCall: IFunctionCall | null = null;

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
    requestArgs: ICallOpenAIChatCompletionParams;
    onFunctionCall: IFunctionCallHandler;
  }): Promise<ReadableStream<Uint8Array>> {
    const response = await this.callOpenAIChatCompletion(requestArgs);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    const message: IStreamMessage = {
      type: "message",
      text: "",
      function_call: undefined,
    };

    return new ReadableStream({
      start: async (controller) => {
        let functionCallDetected: IFunctionCall | null = null;
        let functionResult: unknown | null = null;

        const encoder = new TextEncoder();

        const enqueueContent = (content: string) => {
          if (content) {
            message.text += content;

            const jsonResponse =
              JSON.stringify({
                ...message,
                text: message.text,
              }) + "\n";

            controller.enqueue(encoder.encode(jsonResponse));
          }
        };

        // First streaming pass (read initial response)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const { content, functionCall } = this.processStreamChunk(value);

          enqueueContent(content);

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

        if (functionCallDetected) {
          console.log("🔹 Function call detected:", functionCallDetected);
          functionResult = await onFunctionCall(functionCallDetected);
        }

        console.log("🔹 Function result --> ", JSON.stringify(functionResult));

        // Append function response as a new message
        const updatedMessages: Partial<OpenAiMessage & { name: string }>[] = [
          ...requestArgs.messages,
          {
            role: "system" as OpenAiRole,
            content: "You have called the function. Respond accordingly",
          },
        ];

        if (functionResult) {
          updatedMessages.push({
            role: "function" as OpenAiRole,
            name: functionCallDetected.name,
            content:
              functionResult.functionMessage ||
              JSON.stringify(functionResult.result),
          });
        }

        if (functionCallDetected) {
          message.function_call = functionCallDetected;
        }

        console.log("🔹 Resuming stream with function response...");

        // Call OpenAI again with updated messages
        const resumedResponse = await this.callOpenAIChatCompletion({
          messages: updatedMessages as OpenAiMessage[],
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

          const { content, functionCall } = this.processStreamChunk(value);

          enqueueContent(content);
        }

        controller.close();
      },
    });
  }
}

export default OpenAIService;
