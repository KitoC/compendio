// providers/AzureWebhookProvider.ts
import type {
  IAgentProvider,
  ItTalkToAgentParams,
} from "locals/interfaces/IAgentProvider";
import type { IAiAgent, IOpenAiFunction } from "@/types/aiAgents";
import type {
  OpenAiMessage,
  OpenAiRole,
  ChatMessage,
  NormalChatContent,
} from "@/types/chat";
import {
  ExecuteFunctionCallback,
  FunctionController,
} from "locals/controllers/FunctionController";
import { OpenAiService } from "locals/services/providers/OpenAiService";
import {
  EMAIL_AGENT_PROMPT,
  EMAIL_PRIORITY_PROMPT,
} from "@/SYSTEM_PROMPTS/EMAIL_AGENT_PROMPT";
import Logger from "locals/utils/Logger";
// TODO: Move this to a file or DB and inject schema for Email.
const VALID_OPENAI_ROLES = ["user", "assistant", "function", "system"];

export class OpenAiAgent implements IAgentProvider {
  openAiService: OpenAiService;
  logger: Logger;
  constructor(
    public agent: IAiAgent,
    public functionController: FunctionController
  ) {
    this.logger = new Logger({ name: "OpenAiAgent" });
    this.openAiService = new OpenAiService();
  }

  throwError(
    message: string,
    errorOrStatus?: object | number,
    status?: number
  ) {
    this.logger.throwProviderError(
      this.constructor.name,
      message,
      errorOrStatus || 500,
      status
    );
  }

  normalizeMessage(message: ChatMessage) {
    return {
      role: message.role as OpenAiRole,
      content:
        (message.content as NormalChatContent)?.text ||
        JSON.stringify(message.content),
    };
  }

  normalizeMessages(messages: ChatMessage[]) {
    return messages
      .filter((message) => VALID_OPENAI_ROLES.includes(message.role))
      .map((message) => this.normalizeMessage(message));
  }

  async talkToAgent(
    talkToAgentParams: ItTalkToAgentParams,
    onFunctionCall: ExecuteFunctionCallback
  ) {
    const { messages, model, functions } = talkToAgentParams;

    const normalizedMessages = this.normalizeMessages(messages);

    const stream = await this.openAiService.streamAndCallFunction({
      onFunctionCall,
      requestArgs: {
        messages: normalizedMessages,
        model,
        functions: functions as IOpenAiFunction[],
      },
    });

    return stream;
  }

  async createEmailMessage(email: string) {
    const messages: OpenAiMessage[] = [
      {
        role: "system" as OpenAiRole,
        // TODO: Pull in from a file or DB
        content: EMAIL_AGENT_PROMPT,
      },
      {
        role: "system" as OpenAiRole,
        // TODO: Pull in from a file or DB
        content: EMAIL_PRIORITY_PROMPT,
      },
      {
        role: "user" as OpenAiRole,
        content: JSON.stringify(email),
      },
    ];

    const response = await this.openAiService.callOpenAIChatCompletion({
      messages,
      stream: false,
      model: this.agent.model,
      options: {
        response_format: { type: "json_object" },
        // response_format: {
        //   type: "json_schema",
        //   json_schema: EMAIL_AGENT_JSON_SCHEMA,
        // },
      },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async sendMessages(
    messages: OpenAiMessage[],
    options?: { response_format: { type: string } }
  ) {
    const response = await this.openAiService.callOpenAIChatCompletion({
      messages,
      stream: false,
      model: this.agent.model,
      options,
    });

    return options?.response_format?.type.includes("json")
      ? JSON.parse(response.choices[0].message.content)
      : response.choices[0].message.content;
  }
}
