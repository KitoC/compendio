import { getEnvKey } from "locals/utils/env";
import { BaseController } from "locals/controllers/_BaseController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { ICredential } from "locals/services/CredentialsService";
import { OAuthController } from "locals/controllers/OAuthController";
import { ConnectedService } from "locals/services/ConnectedServicesService";
import { getWebhookProvider } from "locals/providers/WebhookProviderRegistry";
import { ProviderError } from "locals/error-types";

interface ISubscribeToWebhookParams {
  tenant_id: string;
  connected_service_id: string;
}

// TODO: Add support for other providers
class WebhookController extends BaseController {
  private connectedService: ConnectedService | null;
  private credential: ICredential | null;
  private accessToken: string | null;

  constructor(
    public req: Request,
    public context: PublicContext | AuthenticatedContext,
    public oauthController: OAuthController
  ) {
    super();
    this.connectedService = null;
    this.credential = null;
    this.accessToken = null;
  }

  getWebhookUrl(params: ISubscribeToWebhookParams) {
    const { tenant_id, connected_service_id } = params;

    const baseFunctionsUrl = getEnvKey("SUPABASE_FUNCTIONS_URL");

    const paramsString = new URLSearchParams({
      tenant_id,
      connected_service_id,
    }).toString();

    return `${baseFunctionsUrl}/webhook?${paramsString}`;
  }

  async subscribeToProvider(params: ISubscribeToWebhookParams) {
    try {
      if (!this.credential) {
        this.throwError("No credential found", 500);
        return;
      }

      const { provider } = this.credential;

      const webhookProvider = getWebhookProvider(provider);

      return await webhookProvider.subscribeToWebhook({
        tenant_id: params.tenant_id,
        connected_service_id: params.connected_service_id,
        accessToken: this.accessToken!,
        clientState: this.connectedService!.client_state,
        webhookUrl: this.getWebhookUrl(params),
        changeType: this.connectedService!.webhook_change_type,
        resource: this.connectedService!.webhook_resource,
      });
    } catch (e) {
      if (e instanceof ProviderError) {
        throw e;
      } else {
        this.logger.error("Error subscribing to provider", e as Error);
        this.throwError("Error subscribing to provider", e as Error, 500);
      }
    }
  }

  async getConnectedServiceAndRefreshToken(connected_service_id: string) {
    const { context, oauthController } = this;
    const connectedService =
      await context.connectedServicesService.getConnectedService(
        connected_service_id
      );

    this.connectedService = connectedService;

    const credential = await context.credentialsService.getCredential(
      connectedService.credential_id
    );

    this.credential = credential;

    const refreshCredentialResponse =
      await oauthController.refreshOauthCredential(credential);

    if (!refreshCredentialResponse) {
      this.throwError("Failed to refresh credential", 500);
      return;
    }

    const accessToken = refreshCredentialResponse.tokenData.access_token;

    this.accessToken = accessToken;

    return {
      accessToken,
      credential,
    };
  }

  async subscribeToWebhook(params: ISubscribeToWebhookParams) {
    if (!params.tenant_id || !params.connected_service_id) {
      this.throwError("Missing required parameters", 400);
    }

    await this.getConnectedServiceAndRefreshToken(params.connected_service_id);

    if (!this.connectedService) {
      this.throwError("Connected service not found", 500);
      return;
    }

    const response = await this.subscribeToProvider(params);

    if (!response) {
      this.throwError("Failed to subscribe to webhook", 500);
      return;
    }

    const { subscription_id, subscription_expires_at } = response;

    await this.context.connectedServicesService.updateConnectedService({
      id: this.connectedService.id,
      subscription_id,
      subscription_expires_at,
    });

    this.logger.info("Webhook subscribed successfully", {
      subscription_id,
      expires: subscription_expires_at,
    });

    return {
      subscription_id,
      subscription_expires_at,
    };
  }
}

export { WebhookController };
