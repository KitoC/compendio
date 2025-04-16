// NO_CHANGE

import { IConversation } from "@/services/ConversationsService";
import {
  DEFAULT_EMAIL_PRIORITY_SCALE,
  NORMALIZE_EMAIL_PAYLOAD_PROMPT,
} from "@/SYSTEM_PROMPTS/EMAIL/NORMALIZE_EMAIL_PAYLOAD_PROMPT";
import { DRAFT_EMAIL_PROMPT } from "@/SYSTEM_PROMPTS/EMAIL/DRAFT_EMAIL_PROMPT";
import { AgentController } from "@/controllers/AgentController";

export type NormalizedEmailThreadMessage = {
  body: string;
  from: string;
  timestamp: string; // ISO 8601
};

export type FunctionCall = {
  name: string;
  type: "retrieval";
  parameters: Record<string, unknown>; // Use `zod` or specific typing if you have schema definitions
};

export type NormalizedEmailResponse = {
  status: "draft" | "received" | "sent";
  email_id: string;
  email_received: {
    from: string;
    to: string;
    subject: string;
    latest_message: NormalizedEmailThreadMessage;
    thread: NormalizedEmailThreadMessage[];
  };
  email_thread_id: string;
  event: string; // e.g. "email_received"
  provider: "gmail" | "outlook";
  function_calls?: FunctionCall[];
  reasoning: string;
  summary: string;
  priority: number;
};

export type DraftEmailResponse = {
  email_drafted: {
    to: string;
    body: string;
  } | null;
  reasoning: string;
  summary: string;
};

class EmailAgentController extends AgentController {
  async getPriorityScale() {
    return DEFAULT_EMAIL_PRIORITY_SCALE;
  }
  async normalizeEmailPayload(
    email: object,
    emailNormalizationConfig: object
  ): Promise<NormalizedEmailResponse> {
    const functions = await this.getFunctions();

    const priorityScale = await this.getPriorityScale();

    const response = await this.agentAdapter.sendMessages(
      [
        {
          role: "system",
          content: NORMALIZE_EMAIL_PAYLOAD_PROMPT.replace(
            "%%PRIORITY_SCALE%%",
            priorityScale
          ),
        },
        { role: "system", content: this.agent.prompt || "" },
        { role: "system", content: JSON.stringify(emailNormalizationConfig) },
        { role: "system", content: JSON.stringify(functions) },
        { role: "user", content: JSON.stringify(email) },
      ],
      { response_format: { type: "json_object" } }
    );

    return response as NormalizedEmailResponse;
  }

  async draftEmail(
    normalizedEmailPayload: object | string,
    contextData: object
  ): Promise<DraftEmailResponse> {
    const response = await this.agentAdapter.sendMessages(
      [
        { role: "system", content: DRAFT_EMAIL_PROMPT },
        { role: "system", content: this.agent.prompt || "" },
        { role: "system", content: JSON.stringify(contextData) },
        { role: "user", content: JSON.stringify(normalizedEmailPayload) },
      ],
      { response_format: { type: "json_object" } }
    );

    return response as DraftEmailResponse;
  }

  async createEmailMessage(email: object, emailNormalizationConfig: object) {
    this.logger.info("Creating email message", { agentId: this.agent.id });

    const agentConversations =
      await this.context.conversationsService.getAgentConversations(
        this.agent.id
      );

    this.logger.info("🔹 Getting normalized email payload");

    const normalizedEmailPayload = await this.normalizeEmailPayload(
      email,
      emailNormalizationConfig
    );

    this.logger.debug("normalizedEmailPayload -->", normalizedEmailPayload);

    this.logger.info("🔹 Retrieving context data");

    const contextData = {};

    this.logger.info("🔹 Drafting email");

    const draftEmail = await this.draftEmail(
      normalizedEmailPayload,
      contextData
    );

    this.logger.debug("draftEmail -->", draftEmail);

    const emailContent = {
      ...draftEmail,
      ...normalizedEmailPayload,
    };

    const uuid = `${emailContent.provider}_${emailContent.email_thread_id}`;

    const messages = await this.context.messagesService.get({
      filter: {
        "metadata->>uuid": { eq: uuid },
      },
    });

    const message = messages?.[0];

    if (message) {
      this.logger.info("🔹 Message found, updating message");
      return await this.context.messagesService.updateMessage({
        message_id: message.id,
        content: emailContent,
        role: "email_agent",
        metadata: {
          ...message.metadata,
          status: draftEmail.email_drafted ? "draft" : "received",
          priority: emailContent.priority,
          received_at: emailContent.email_received.latest_message.timestamp,
        },
      });
    } else {
      this.logger.info("No message found, creating new message");
      const conversation_ids = agentConversations.map(
        (conversation: IConversation) => conversation.id
      );

      this.logger.info("🔹 Creating new message");

      const newMessage = {
        content: emailContent,
        role: "email_agent",
        tenant_id: this.agent.tenant_id as string,
        user_id: this.agent.id,
        connected_service_id: JSON.parse(this.sessionContext)
          .connected_service_id,
        metadata: {
          uuid,
          status: draftEmail.email_drafted ? "draft" : "received",
          priority: emailContent.priority,
          received_at: emailContent.email_received.latest_message.timestamp,
        },
      };

      return this.context.messagesService.createMessageForConversations(
        conversation_ids,
        newMessage
      );
    }
  }
}

export { EmailAgentController };
