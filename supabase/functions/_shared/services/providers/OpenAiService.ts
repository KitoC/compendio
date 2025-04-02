import type { IFunctionCall, IOpenAiFunction } from "@/types/aiAgents";
import type { OpenAiMessage, OpenAiRole } from "../../../../../types/chat";
import { BaseExternalService } from "locals/services/_BaseExternalService";
import { getEnvKey } from "locals/utils/env";
import {
  ExecuteFunctionCallback,
  ExecuteFunctionResult,
} from "locals/controllers/FunctionController";

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

export class OpenAiService extends BaseExternalService {
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    super();
    this.apiKey = getEnvKey("OPENAI_API_KEY");
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
    this.logger.info("IS STREAMING?", stream ? "YES" : "NO");

    const body = {
      model,
      messages,
      stream,
      functions: functions?.length ? functions : undefined,
      ...options,
    };

    let stringifiedBody;
    try {
      stringifiedBody = JSON.stringify(body);
    } catch (e) {
      this.throwError("🔹 Error stringifying body", e as Error);
    }

    const response = await fetch(ENDPOINTS.COMPLETIONS, {
      method: "POST",
      headers: this.headers,
      body: stringifiedBody,
    });

    if (!response.ok) {
      const json = await response.json();

      this.throwError(
        `Error in OpenAIService.callOpenAIChatCompletion: ${json.error.message}`,
        json.error
      );
    }

    if (stream) {
      this.logger.info("🔹 OpenAI response is streaming");

      return response;
    }

    const json = await response.json();

    return json;
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
          console.error("Error parsing JSON chunk:", data, e);
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
    onFunctionCall: ExecuteFunctionCallback;
  }): Promise<ReadableStream<Uint8Array>> {
    const response = await this.callOpenAIChatCompletion(requestArgs);

    const reader = response.body?.getReader();

    if (!reader) {
      this.throwError("Failed to get response reader", 500);
    }

    const message: IStreamMessage = {
      type: "message",
      text: "",
      function_call: undefined,
    };

    return new ReadableStream({
      start: async (controller) => {
        this.logger.info("🔹 Starting streamAndCallFunction");
        let functionCallDetected: IFunctionCall | null = null;
        let functionResult: ExecuteFunctionResult | null = null;

        const encoder = new TextEncoder();

        const enqueueContent = (content: string) => {
          if (content) {
            const updatedText = message.text + content;
            message.text = updatedText;

            const jsonResponse =
              JSON.stringify({
                ...message,
                text: updatedText,
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
          functionResult = await onFunctionCall(functionCallDetected);
        }

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

        while (true) {
          const { done, value } = await resumedReader.read();
          if (done) break;

          const { content } = this.processStreamChunk(value);

          enqueueContent(content);
        }

        controller.close();
      },
    });
  }
}
