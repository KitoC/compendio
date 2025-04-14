import type { IFunctionCall, IOpenAiFunction } from "@/types/aiAgents";
import type { OpenAiMessage, OpenAiRole } from "@/types/chat";
import { BaseExternalService } from "locals/services/_BaseExternalService";
import { getEnvKey } from "locals/utils/env";
import { ExecuteFunctionCallback } from "locals/controllers/FunctionController";

const OPEN_AI_URL = "https://api.openai.com";

const ENDPOINTS = {
  COMPLETIONS: `${OPEN_AI_URL}/v1/chat/completions`,
};

interface ICallOpenAIChatCompletionParams {
  messages: OpenAiMessage[];
  model?: string;
  stream?: boolean;
  functions?: IOpenAiFunction[];
  options?: object;
}

interface IStreamMessage {
  type: string;
  text: string;
  function_call?: IFunctionCall;
  background_tasks: {
    name: string;
    arguments: Record<string, unknown>;
  }[];
}

type IToolCall = {
  id: string;
  functionCall: {
    name: string;
    arguments: string;
  };
  index: number;
};

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
    options = { response_format: { type: "text" } },
  }: ICallOpenAIChatCompletionParams) {
    this.logger.info("IS STREAMING?", stream ? "YES" : "NO");

    const tools = functions?.map((fn) => ({
      type: "function",
      function: {
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      },
      metadata: fn.metadata,
      strict: true,
    }));

    const body = {
      model,
      messages,
      stream,
      tools,
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
    toolCalls: IToolCall[];
  } {
    const text = new TextDecoder().decode(chunk);
    let content = "";
    const toolCalls: IToolCall[] = [];
    const toolCallMap: Record<string, IToolCall> = {};

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

          // ✅ Handle new tool_calls array (streamed piece by piece)
          const toolCallChunk = choice?.delta?.tool_calls?.[0];

          if (toolCallMap[toolCallChunk?.index]) {
            toolCallMap[toolCallChunk.index].functionCall.arguments +=
              toolCallChunk.function.arguments;
          } else if (toolCallChunk?.index >= 0) {
            toolCallMap[toolCallChunk.index] = {
              id: toolCallChunk.id,
              index: toolCallChunk.index,
              functionCall: {
                name: toolCallChunk.function.name,
                arguments: toolCallChunk.function.arguments,
              },
            };
          }

          // Optional fallback for legacy support
          if (choice?.delta?.function_call && toolCalls.length === 0) {
            toolCalls.push({
              id: "legacy",
              index: 0,
              functionCall: {
                name: choice.delta.function_call.name,
                arguments: choice.delta.function_call.arguments
                  ? JSON.parse(choice.delta.function_call.arguments)
                  : {},
              },
            });
          }
        } catch (e) {
          console.error("Error parsing JSON chunk:", data, e);
          content += data;
        }
      }
    }

    return { content, toolCalls: Object.values(toolCallMap) };
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

    const TOOLS_METADATA_REGISTRY = (requestArgs.functions || []).reduce(
      (acc, fn) => {
        acc[fn.name] = fn.metadata || { is_background_task: false };

        return acc;
      },
      {} as Record<string, { is_background_task?: boolean }>
    );

    if (!reader) this.throwError("Failed to get response reader", 500);

    const message: IStreamMessage = {
      type: "message",
      text: "",
      function_call: undefined,
      background_tasks: [],
    };

    return new ReadableStream({
      start: async (controller) => {
        this.logger.info("Starting streamAndCallFunction");
        const encoder = new TextEncoder();
        let allToolCalls: IToolCall[] = [];

        const enqueueContent = (content: string) => {
          if (content) {
            message.text += content;
            const jsonResponse = JSON.stringify({ ...message }) + "\n";
            controller.enqueue(encoder.encode(jsonResponse));
          }
        };

        // Initial streaming pass — detect tool calls
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const { content, toolCalls } = this.processStreamChunk(value);

          enqueueContent(content);

          if (toolCalls.length > 0) {
            const hasToolCall = allToolCalls.find((toolCall) =>
              toolCalls.find((tc) => tc.index === toolCall.index)
            );

            if (hasToolCall) {
              allToolCalls = allToolCalls.map((toolCall) => {
                const newToolCall = toolCalls.find(
                  (tc) => tc.index === toolCall.index
                );

                if (newToolCall) {
                  toolCall.functionCall.arguments +=
                    newToolCall.functionCall.arguments;
                }

                return toolCall;
              });
            } else {
              allToolCalls = [...allToolCalls, ...toolCalls];
            }
          }
        }

        if (!allToolCalls.length) {
          this.logger.debug("no tool calls --> closing stream");
          controller.close();
          return;
        }

        // Handle tool calls if any
        const functionResults: {
          role: OpenAiRole;
          name: string;
          content: string;
        }[] = [];

        this.logger.debug("allToolCalls --> ", allToolCalls);

        for (const call of allToolCalls) {
          const functionCall = {
            name: call.functionCall.name,
            arguments: JSON.parse(call.functionCall.arguments),
          };

          if (TOOLS_METADATA_REGISTRY[functionCall.name].is_background_task) {
            message.background_tasks.push(functionCall);

            functionResults.push({
              role: "function" as OpenAiRole,
              name: functionCall.name,
              content: "Background task started",
            });
          } else {
            const result = await onFunctionCall(functionCall);

            functionResults.push({
              role: "function" as OpenAiRole,
              name: functionCall.name,
              content:
                result.functionMessage || JSON.stringify(result.result) || "",
            });
          }
        }

        // Resume stream with function results
        const updatedMessages: OpenAiMessage[] = [
          ...requestArgs.messages,
          {
            role: "system" as OpenAiRole,
            content:
              "You have called one or more tools. Respond accordingly. If you have called a background task, respond in normal chat mode.",
          },
          ...functionResults,
        ];

        const resumedResponse = await this.callOpenAIChatCompletion({
          messages: updatedMessages,
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
