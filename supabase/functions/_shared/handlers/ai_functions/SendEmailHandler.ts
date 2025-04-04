// ============================================
// EmailReceivedHandler.ts
// Handles 'process-email-received' task type
// ============================================

import { PublicContext } from "locals/middleware/withPublicContext";

import { OAuthController } from "locals/controllers/OAuthController";
import { ConnectedServiceController } from "@/controllers/ConnectedServiceController";
import { AzureService } from "locals/services/providers/AzureService";
import { EmailAgentController } from "locals/controllers/EmailAgentController";
import { FunctionController } from "locals/controllers/FunctionController";
import Logger from "locals/utils/Logger";
import {
  IAgentFunctionHandler,
  IAgentFunctionHandlerResult,
} from "locals/interfaces/IAgentFunctionHandler";
import type { IFunction, IFunctionCall } from "@/types/aiAgents";

export interface ITaskPayload {
  message_id: string;
  conversation_id: string;
  agent_id: string;
  function_call: object;
}

type EmailProviderServiceMap = {
  azure: AzureService;
  outlook: AzureService;
};

// TODO: Make Configurable
const EMAIL_SUMMARY_PROMPT = `
   - Summarize the email in a few sentences.
   - Include the main points and any relevant details.
   - Keep it concise and to the point.
   - Use full thread as context.
   `;
export class SendEmailHandler implements IAgentFunctionHandler {
  emailProviderServiceMap: EmailProviderServiceMap;
  logger: Logger;
  connectedServiceController: ConnectedServiceController;
  constructor(public context: PublicContext) {
    this.logger = new Logger({ name: "SendEmailHandler" });
    this.connectedServiceController = new ConnectedServiceController(
      context,
      new OAuthController(context)
    );

    this.emailProviderServiceMap = {
      azure: context.azureService,
      outlook: context.azureService,
    };
  }

  async handle(
    fnCall: IFunctionCall,
    fn: IFunction
  ): Promise<IAgentFunctionHandlerResult> {
    const { message_id } = JSON.parse(fnCall.arguments);

    const message = await this.context.messagesService.getMessageById(
      message_id
    );
    const { email_drafted, provider, email_id } = message.content;

    const connectedService =
      await this.connectedServiceController.getConnectedServiceAndRefreshToken(
        message.connected_service_id
      );

    const agentController = await EmailAgentController.create({
      context: this.context,
      functionController: new FunctionController(this.context),
      agentId: message.user_id,
      sessionContext: {
        connected_service_id: message.connected_service_id,
        tenant_id: message.tenant_id,
      },
    });

    if (!connectedService) {
      this.connectedServiceController.throwError(
        "Failed to get connected service",
        500
      );

      return {
        result: null,
        functionMessage: "Failed to get connected service",
      };
    }

    const emailProviderService =
      this.emailProviderServiceMap[provider as keyof EmailProviderServiceMap];

    emailProviderService.setAccessToken(connectedService.accessToken);

    if (email_id) {
      await emailProviderService.replyToEmail({
        originalMessageId: email_id,
        replyBody: email_drafted.body,
        contentType: email_drafted.content_type || "Text",
      });

      this.logger.info("🔹 Email reply sent successfully");
    } else {
      await emailProviderService.sendEmail(email_drafted);

      this.logger.info("🔹 Email sent successfully");
    }

    const updatedMessage =
      await agentController.updateMessageWithSummaryMetadata(
        {
          message_id: message.id,
          content: {
            ...message.content,
            email_drafted: undefined,
            email_sent: {
              body: email_drafted.body,
              to: email_drafted.to,
              sent_at: new Date().toISOString(),
            },
          },
          role: message.role,
          metadata: message.metadata,
        },
        EMAIL_SUMMARY_PROMPT
      );
    this.logger.info("🔹 Message updated with summary metadata");

    return {
      result: updatedMessage,
      functionMessage: "Email sent successfully",
    };
  }
}
