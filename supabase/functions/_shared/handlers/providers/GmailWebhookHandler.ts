import { PublicContext } from "locals/middleware/withPublicContext";
import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";
import { ConnectedService } from "locals/services/ConnectedServicesService";
import { IWebhookProvider } from "locals/interfaces/IWebhookProvider";
import Logger from "locals/utils/Logger";
import type { IEmailEvent } from "../WebhookEventHandler";

export interface IHandleParams {
  url: URL;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  headers: Headers;
  context: PublicContext;
}

export class GmailWebhookHandler {
  private logger: Logger;

  constructor(
    private connectedService: ConnectedService,
    private accessToken: string,
    private webhookProvider: IWebhookProvider,
    private processEmailReceivedEvent: (
      emailEvent: IEmailEvent
    ) => Promise<RequestHandlerResponse>
  ) {
    this.logger = new Logger({ name: "GmailWebhookHandler" });
  }

  async handle({
    body,
    headers,
    context,
  }: IHandleParams): Promise<RequestHandlerResponse> {
    const encodedData = body?.message?.data;
    const decodedData = JSON.parse(atob(encodedData));

    await context.webhookEventService.createWebhookEvent({
      tenant_id: this.connectedService.tenant_id,
      payload: body,
      headers,
      connected_service_id: this.connectedService.id,
      status: "received",
    });

    await this.processEmailReceivedEvent({
      history_id: decodedData.historyId,
      email_address: decodedData.emailAddress,
    });

    return { body: null, headers: {}, status: 202 };
  }
}
