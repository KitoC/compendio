// providers/AzureWebhookProvider.ts
import type { IAgentProvider } from "locals/interfaces/IAgentProvider";
import type { IAiAgent } from "../../../../../src/types/aiAgents";
import type {
  ChatMessage,
  OpenAiMessage,
  OpenAiRole,
} from "../../../../../src/types/chat";
import { FunctionController } from "locals/controllers/FunctionController";
import { OpenAiService } from "locals/services/providers/OpenAiService";

import { EMAIL_AGENT_PROMPT } from "@/SYSTEM_PROMPTS/EMAIL_AGENT_PROMPT";
// TODO: Move this to a file or DB and inject schema for Email.

export class OpenAiAgent implements IAgentProvider {
  openAiService: OpenAiService;
  constructor(
    public agent: IAiAgent,
    public functionController: FunctionController
  ) {
    this.openAiService = new OpenAiService();
  }

  async talkToAgent(newMessage: ChatMessage) {
    return {
      id: "1",
      conversation_id: "1",
      metadata: {},
      tenant_id: "1",
      role: "assistant",
      content: { text: "Hello, how can I help you today?" },
    };
  }

  async createEmailMessage(email: string) {
    const messages: OpenAiMessage[] = [
      {
        role: "system" as OpenAiRole,
        // TODO: Pull in from a file or DB
        content: EMAIL_AGENT_PROMPT,
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
}
