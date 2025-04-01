// ============================================
// EmailReceivedHandler.ts
// Handles 'process-email-received' task type
// ============================================

import { ITaskHandler } from "locals/interfaces/ITaskHandler";
import { PublicContext } from "locals/middleware/withPublicContext";

import { OAuthController } from "locals/controllers/OAuthController";
import { ConnectedServiceController } from "@/controllers/ConnectedServiceController";
import type { IEmailEvent } from "locals/handlers/WebhookEventHandler";
import { AzureService } from "locals/services/providers/AzureService";
import { EmailAgentController } from "locals/controllers/EmailAgentController";
import { FunctionController } from "locals/controllers/FunctionController";
import Logger from "locals/utils/Logger";
import { PROVIDERS } from "locals/consts";

export interface ITaskPayload {
  connected_service_id: string;
  tenant_id: string;
  agentId: string;
  provider: (typeof PROVIDERS)[keyof typeof PROVIDERS];
  email_event: IEmailEvent;
}

type EmailProviderServiceMap = {
  azure: AzureService;
};

export class EmailReceivedHandler implements ITaskHandler {
  emailProviderServiceMap: EmailProviderServiceMap;
  logger: Logger;
  constructor(private context: PublicContext) {
    this.logger = new Logger({ name: "EmailReceivedHandler" });
    this.emailProviderServiceMap = {
      azure: context.azureService,
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

    const { accessToken } = response;

    this.logger.info("Getting email provider service");
    const emailProviderService = this.emailProviderServiceMap[provider];

    emailProviderService.setAccessToken(accessToken);

    this.logger.info("Getting email");
    const email = await emailProviderService.getEmail(email_event.email_id);

    const agentController = await EmailAgentController.create({
      context,
      functionController: new FunctionController(context),
      agentId,
      sessionContext: { connected_service_id, tenant_id },
    });

    await agentController.createEmailMessage(
      email,
      emailProviderService.emailNormalizationConfig
    );

    this.logger.info("Email received handler completed");
    return { success: true };
  }
}
