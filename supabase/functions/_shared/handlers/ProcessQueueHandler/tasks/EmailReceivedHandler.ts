// ============================================
// EmailReceivedHandler.ts
// Handles 'process-email-received' task type
// ============================================

import { ITaskHandler } from "@/interfaces/ITaskHandler";
import { PublicContext } from "@/middleware/withPublicContext";

import { OAuthController } from "@/controllers/OAuthController";
import { ConnectedServiceController } from "@/controllers/ConnectedServiceController";
import type { IEmailEvent } from "@/handlers/WebhookEventHandler";
import { AzureService } from "@/services/providers/AzureService";
import { GmailService } from "@/services/providers/GmailService";
import { EmailAgentController } from "@/controllers/EmailAgentController";
import { FunctionController } from "@/controllers/FunctionController";
import Logger from "@/utils/Logger";
import { PROVIDERS } from "@/consts";
import { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { ConnectedService } from "@/services/ConnectedServicesService";
import { parseGmailMessageForAI } from "@/utils/email/parseGmailMessageForAI";

export interface ITaskPayload {
  connected_service_id: string;
  tenant_id: string;
  agentId: string;
  provider: (typeof PROVIDERS)[keyof typeof PROVIDERS];
  email_event: IEmailEvent;
}

type EmailProviderServiceMap = {
  azure: AzureService;
  google: GmailService;
};

interface ISubHandlerPayload<Service> {
  emailProviderService: Service;
  email_event: IEmailEvent;
  agentController: EmailAgentController;
  connectedService: ConnectedService;
}

export class EmailReceivedHandler implements ITaskHandler {
  emailProviderServiceMap: EmailProviderServiceMap;
  logger: Logger;
  constructor(private context: PublicContext) {
    this.logger = new Logger({ name: "EmailReceivedHandler" });
    this.emailProviderServiceMap = {
      azure: context.azureService,
      google: context.gmailService,
    };
  }

  async handle(
    payload: ITaskPayload,
    context: PublicContext
  ): Promise<unknown> {
    const { connected_service_id, email_event, provider, tenant_id, agentId } =
      payload;
    // Example logic for processing an incoming email

    const connectedServiceController = new ConnectedServiceController(
      context,
      new OAuthController(context)
    );

    this.logger.info("Getting connected service");
    const response =
      await connectedServiceController.getConnectedServiceAndRefreshToken(
        connected_service_id
      );

    if (!response) {
      return { success: false, error: "Failed to get connected service" };
    }

    const { accessToken, connectedService } = response;

    const agentController = await EmailAgentController.create({
      context: context as AuthenticatedContext,
      functionController: new FunctionController(context),
      agentId,
      sessionContext: JSON.stringify({ connected_service_id, tenant_id }),
    });

    this.logger.info("Getting email provider service", provider);
    const emailProviderService = this.emailProviderServiceMap[provider];

    if (!emailProviderService) {
      return { success: false, error: "Invalid provider" };
    }

    emailProviderService.setAccessToken(accessToken);

    const subHandlerPayload = {
      emailProviderService,
      email_event,
      agentController,
      connectedService,
    };

    if (provider === "azure") {
      await this.handleAzureEmail(
        subHandlerPayload as unknown as ISubHandlerPayload<AzureService>
      );
    } else if (provider === "google") {
      await this.handleGmailEmail(
        subHandlerPayload as unknown as ISubHandlerPayload<GmailService>
      );
    }

    this.logger.info("Email received handler completed");
    return { success: true };
  }

  async handleGmailEmail({
    emailProviderService,
    email_event,
    agentController,
    connectedService,
  }: ISubHandlerPayload<GmailService>) {
    const { history, historyId } = await emailProviderService.getHistory(
      connectedService.subscription_id
    );

    const threadIds: string[] = [];

    history.forEach(
      (h: { messagesAdded: { message: { threadId: string } }[] }) => {
        h.messagesAdded.forEach((m) => {
          if (m.message.threadId && !threadIds.includes(m.message.threadId)) {
            threadIds.push(m.message.threadId);
          }
        });
      }
    );

    await Promise.all(
      threadIds.map(async (id) => {
        const thread = await emailProviderService.getThread(id);

        const parsedThread = {
          threadId: thread.id,
          threadMessages: thread.messages.map(parseGmailMessageForAI),
        };

        await agentController.createEmailMessage(
          parsedThread,
          emailProviderService.emailNormalizationConfig
        );
      })
    );
  }

  async handleAzureEmail({
    emailProviderService,
    email_event,
    agentController,
  }: ISubHandlerPayload<AzureService>) {
    this.logger.info("Getting email");
    const email = await emailProviderService.getEmail(email_event);

    await agentController.createEmailMessage(
      email,
      emailProviderService.emailNormalizationConfig
    );
  }
}
