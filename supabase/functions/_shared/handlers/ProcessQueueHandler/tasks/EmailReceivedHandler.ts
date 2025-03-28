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
import { AgentController } from "locals/controllers/AgentController";
import { FunctionController } from "locals/controllers/FunctionController";

export interface ITaskPayload {
  connected_service_id: string;
  tenant_id: string;
  agentId: string;
  provider: (typeof PROVIDERS)[keyof typeof PROVIDERS];
  email_event: IEmailEvent;
}

export const PROVIDERS = {
  AZURE: "azure",
} as const;

type EmailProviderServiceMap = {
  azure: AzureService;
};

export class EmailReceivedHandler implements ITaskHandler {
  emailProviderServiceMap: EmailProviderServiceMap;

  constructor(private context: PublicContext) {
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

    const response =
      await connectedServiceController.getConnectedServiceAndRefreshToken(
        connected_service_id
      );

    if (!response) {
      return { success: false, error: "Failed to get connected service" };
    }

    const { accessToken } = response;

    const emailProviderService = this.emailProviderServiceMap[provider];

    emailProviderService.setAccessToken(accessToken);

    const email = await emailProviderService.getEmail(email_event.email_id);

    const agentController = await AgentController.create({
      context,
      functionController: new FunctionController(context),
      agentId,
      sessionContext: { connected_service_id, tenant_id },
    });

    await agentController.createEmailMessage(email);

    return { success: true };
  }
}
