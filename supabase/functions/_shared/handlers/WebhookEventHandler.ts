import { WebhookController } from "locals/controllers/WebhookController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";
import { OAuthController } from "locals/controllers/OAuthController";
import { getWebhookProvider } from "locals/providers/WebhookProviderRegistry";
import { OutlookWebhookHandler } from "locals/handlers/providers/OutlookWebhookHandler";
import { GmailWebhookHandler } from "locals/handlers/providers/GmailWebhookHandler";
import Logger from "locals/utils/Logger";
export interface IEmailEvent {
  // For Outlook
  email_id?: string;
  e_tag?: string;

  // For Gmail
  history_id?: string;
  email_address?: string;
}

function extractIdsFromGooglePubSubSubscriptionPath(
  subscriptionPath: string
): { tenant_id: string; connected_service_id: string } | null {
  const match = subscriptionPath.match(/gmail-sub_(.+?)_(.+)$/);
  if (!match) return null;

  const [, tenant_id, connected_service_id] = match;
  return { tenant_id, connected_service_id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getConnectedServiceId = async (url: URL, body: any) => {
  if (url.searchParams.get("connected_service_id")) {
    return url.searchParams.get("connected_service_id");
  }

  if (body?.subscription?.includes("gmail-sub")) {
    const ids = extractIdsFromGooglePubSubSubscriptionPath(body.subscription);

    if (ids) {
      return ids.connected_service_id;
    }
  }

  return null;
};

export class WebhookEventHandler {
  private logger: Logger;

  constructor(private context: PublicContext) {
    this.logger = new Logger({ name: "WebhookEventHandler" });
  }

  async handle(
    req: Request,
    context: PublicContext
  ): Promise<RequestHandlerResponse> {
    const url = new URL(req.url);
    const body = await req.json();

    const connected_service_id = await getConnectedServiceId(url, body);

    if (!connected_service_id) {
      this.logger.error("Missing connected service id");

      return {
        body: "Missing connected service id",
        headers: { "Content-Type": "text/plain" },
        status: 400,
      };
    }

    const webhookController = new WebhookController(
      context,
      new OAuthController(context)
    );

    const response = await webhookController.getConnectedServiceAndRefreshToken(
      connected_service_id
    );

    if (!webhookController.connectedService) {
      return {
        body: "Connected service not found",
        headers: { "Content-Type": "text/plain" },
        status: 404,
      };
    }

    if (!response) {
      return {
        body: "Access token or credential not found",
        headers: { "Content-Type": "text/plain" },
        status: 404,
      };
    }

    const source = webhookController.connectedService.service_type;
    const webhookProvider = getWebhookProvider(
      response.credential.provider,
      source
    );

    const processEmailReceivedEvent = async (email_event: IEmailEvent) => {
      const res = await context.functionQueueService.enqueueTask(
        "process_email_received",
        {
          email_event,
          tenant_id: webhookController.connectedService?.tenant_id,
          connected_service_id,
          agentId: webhookController.connectedService?.agent_id,
          provider: response.credential.provider,
        }
      );

      return res;
    };

    switch (source) {
      case "outlook":
        return new OutlookWebhookHandler(
          webhookController.connectedService,
          response.accessToken,
          webhookProvider,
          processEmailReceivedEvent
        ).handle({ url, body, headers: req.headers, context });
      case "gmail":
        return new GmailWebhookHandler(
          webhookController.connectedService,
          response.accessToken,
          webhookProvider,
          processEmailReceivedEvent
        ).handle({ url, body, headers: req.headers, context });
      default:
        return {
          body: "Unsupported provider",
          headers: { "Content-Type": "text/plain" },
          status: 400,
        };
    }
  }
}
