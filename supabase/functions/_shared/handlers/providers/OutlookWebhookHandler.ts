import { AgentController } from "locals/controllers/AgentController";
import { FunctionController } from "locals/controllers/FunctionController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";
import { ConnectedService } from "locals/services/ConnectedServicesService";

export class OutlookWebhookHandler {
  constructor(
    private connectedService: ConnectedService,
    private accessToken: string,
    private agentController: AgentController
  ) {}

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

    if (!event) {
      return {
        body: "Invalid event format",
        headers: { "Content-Type": "text/plain" },
        status: 400,
      };
    }

    if (event.subscriptionId !== this.connectedService.subscription_id) {
      return {
        body: "Invalid subscription id",
        headers: { "Content-Type": "text/plain" },
        status: 400,
      };
    }

    const messageId = event.resourceData.id;

    if (!messageId) {
      return {
        body: "Invalid message id",
        headers: { "Content-Type": "text/plain" },
        status: 400,
      };
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=subject,body,from,toRecipients`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        body: "Failed to fetch email",
        headers: { "Content-Type": "text/plain" },
        status: 500,
      };
    }

    const json = await response.json();

    const email = await this.agentController.createEmailMessage(json);

    return {
      body: JSON.stringify(email),
      headers: { "Content-Type": "text/json" },
      // body: "Event received",
      // headers: { "Content-Type": "text/plain" },
      status: 200,
    };
  }
}
