import type {
  IFunctionCall,
  IOpenAiFunction,
} from "../../../../../src/types/aiAgents";
import type { OpenAiMessage } from "../../../../../src/types/chat";
import { BaseExternalService } from "locals/services/_BaseExternalService";
import { getEnvKey } from "locals/utils/env";

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

    const response = await fetch(ENDPOINTS.COMPLETIONS, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!response.ok) {
      this.throwError(
        `Error in OpenAIService.callOpenAIChatCompletion: ${json.error.message}`,
        json.error
      );
    }

    return json;
  }
}
