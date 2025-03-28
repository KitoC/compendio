import { PublicContext } from "locals/middleware/withPublicContext";
import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";
import { ConnectedService } from "locals/services/ConnectedServicesService";
import { IWebhookProvider } from "locals/interfaces/IWebhookProvider";
import Logger from "locals/utils/Logger";

export class OutlookWebhookHandler {
  private logger: Logger;

  constructor(
    private connectedService: ConnectedService,
    private accessToken: string,
    private webhookProvider: IWebhookProvider,
    private processEmailReceivedEvent: (
      emailEvent: JSON
    ) => Promise<RequestHandlerResponse>
  ) {
    this.logger = new Logger({ name: "OutlookWebhookHandler" });
  }

  async handle(
    req: Request,
    context: PublicContext
  ): Promise<RequestHandlerResponse> {
    // Handle validationToken (from Graph subscription validation)
    const url = new URL(req.url);
    const validationToken = url.searchParams.get("validationToken");

    if (validationToken) {
      return {
        body: decodeURIComponent(validationToken),
        headers: { "Content-Type": "text/plain" },
        status: 200,
      };
    }

    const body = await req.json();

    const event = body?.value?.[0];

    const webhookEvent = await context.webhookEventService.createWebhookEvent({
      tenant_id: this.connectedService.tenant_id,
      payload: body,
      headers: req.headers,
      connected_service_id: this.connectedService.id,
      status: "received",
    });

    if (!event) {
      await context.webhookEventService.update(webhookEvent.id, {
        status: "failed",
        error_message: "No event",
      });
      return { body: null, headers: {}, status: 204 };
    }

    if (
      this.connectedService.subscription_id &&
      event.subscriptionId !== this.connectedService.subscription_id
    ) {
      this.logger.warn("Cleaning up dead subscription", {
        subscriptionId: event.subscriptionId,
        connectedServiceId: this.connectedService.id,
      });

      await this.webhookProvider.unsubscribeFromWebhook({
        accessToken: this.accessToken,
        subscriptionId: this.connectedService.subscription_id,
      });

      await context.webhookEventService.update(webhookEvent.id, {
        status: "failed",
        error_message: "Subscription ID mismatch (unsubscribed",
      });
      return { body: null, headers: {}, status: 204 };
    }

    const messageId = event.resourceData.id;

    if (!messageId) {
      await context.webhookEventService.update(webhookEvent.id, {
        status: "failed",
        error_message: "No message ID",
      });
      return { body: null, headers: {}, status: 204 };
    }

    await this.processEmailReceivedEvent(event);

    return { body: null, headers: {}, status: 202 };
  }
}
