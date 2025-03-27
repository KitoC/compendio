import { AgentController } from "locals/controllers/AgentController";
import { WebhookController } from "locals/controllers/WebhookController";
import { FunctionController } from "locals/controllers/FunctionController";
import { OutlookWebhookHandler } from "locals/handlers/providers/OutlookWebhookHandler";
import { PublicContext } from "locals/middleware/withPublicContext";
import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";
import { OAuthController } from "locals/controllers/OAuthController";
import { getWebhookProvider } from "locals/providers/WebhookProviderRegistry";

export class WebhookEventHandler {
  async handle(
    req: Request,
    context: PublicContext
  ): Promise<RequestHandlerResponse> {
    const url = new URL(req.url);

    const connected_service_id = url.searchParams.get("connected_service_id");
    const tenant_id = url.searchParams.get("tenant_id");

    if (!connected_service_id || !tenant_id) {
      return {
        body: "Missing connected service id or tenant id",
        headers: { "Content-Type": "text/plain" },
        status: 400,
      };
    }

    // Determine source from headers or body

    const webhookController = new WebhookController(
      req,
      context,
      new OAuthController(req, context)
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

    const agentController = await AgentController.create({
      req,
      context,
      functionController: new FunctionController(req, context),
      agentId: webhookController.connectedService.agent_id,
      sessionContext: {
        connected_service_id,
        tenant_id,
      },
    });

    const source = webhookController.connectedService.service_type;
    const webhookProvider = getWebhookProvider(response.credential.provider);

    switch (source) {
      case "outlook":
        return new OutlookWebhookHandler(
          webhookController.connectedService,
          response.accessToken,
          agentController,
          webhookProvider
        ).handle(req, context);
      // case "gmail": return new GmailWebhookHandler().handle(...)
      default:
        return {
          body: "Unsupported provider",
          headers: { "Content-Type": "text/plain" },
          status: 400,
        };
    }
  }
}
