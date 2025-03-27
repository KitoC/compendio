import { getEnvKey } from "locals/utils/env";
import { BaseController } from "locals/controllers/_BaseController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { ICredential } from "locals/services/CredentialsService";
import { OAuthController } from "locals/controllers/OAuthController";
import { ConnectedService } from "locals/services/ConnectedServicesService";
import { getWebhookProvider } from "locals/providers/WebhookProviderRegistry";
import { ProviderError } from "locals/error-types";
import { processInBatches } from "locals/utils/processInBatches";

interface ISubscribeToWebhookParams {
  tenant_id: string;
  connected_service_id: string;
}

// TODO: Add support for other providers
class WebhookController extends BaseController {
  public connectedService: ConnectedService | null;
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

  getSharedExpirationDate(bufferHours = 0): string {
    const now = new Date();
    const offset = 11 - bufferHours; // Outlook max is 11 hours

    return new Date(now.getTime() + offset * 60 * 60 * 1000).toISOString();
  }

  getOneHourFromNow() {
    const now = new Date();

    return new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
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
        expirationDate: this.getSharedExpirationDate(),
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

  async refreshWebhookSubscriptions() {
    const { context } = this;

    const expirationDate = this.getSharedExpirationDate();

    const servicesAboutToExpire = await this.getServicesExpiringSoon();

    const refreshResults = await this.refreshExpiringSubscriptions(
      servicesAboutToExpire,
      expirationDate
    );

    await this.nullifyFailedSubscriptions(refreshResults.failed);

    const servicesToResubscribe = await this.getServicesWithNullSubscriptions();

    const resubscribeResults = await this.resubscribeServices(
      servicesToResubscribe,
      expirationDate
    );

    await this.persistUpdatedSubscriptions([
      ...refreshResults.success,
      ...resubscribeResults.success,
    ]);

    this.logger.info("🔁 Refreshed:", refreshResults.success.length);
    this.logger.info("⚠️ Failed to refresh:", refreshResults.failed.length);
    this.logger.info("✅ Re-subscribed:", resubscribeResults.success.length);
    this.logger.info(
      "🧹 Nullified dead subs:",
      resubscribeResults.failed.length
    );

    return {
      refreshed: refreshResults.success.map((s) => s.item.id),
      failed: refreshResults.failed.map((s) => s.item.id),
      resubscribed: resubscribeResults.success.map((s) => s.item.id),
      permanentlyFailed: resubscribeResults.failed.map((s) => s.item.id),
    };
  }

  async getServicesExpiringSoon(): Promise<ConnectedService[]> {
    const now = new Date();
    const offset = 1.5; // 1.5 hours

    const withinNextDate = new Date(
      now.getTime() + offset * 60 * 60 * 1000
    ).toISOString();

    return this.context.connectedServicesService.get({
      filter: {
        subscription_expires_at: { lt: withinNextDate },
      },
      columns: "*, credential:credentials(id, provider)",
    });
  }

  async refreshExpiringSubscriptions(
    services: ConnectedService[],
    expirationDate: string
  ) {
    return processInBatches({
      items: services,
      batchSize: 5,
      processor: async (service) => {
        const provider = getWebhookProvider(service.credential!.provider);
        const accessToken = await this.oauthController.getRefreshedAccessToken(
          service.credential_id
        );

        const result = await provider.refreshWebhookSubscription({
          accessToken,
          subscriptionId: service.subscription_id,
          expirationDate,
        });

        return {
          ...service,
          subscription_id: result.subscription_id,
          subscription_expires_at: result.subscription_expires_at,
        };
      },
    });
  }

  async nullifyFailedSubscriptions(failedItems: { item: ConnectedService }[]) {
    await processInBatches({
      items: failedItems,
      batchSize: 5,
      processor: async ({ item: service }) => {
        await this.context.connectedServicesService.update(service.id, {
          subscription_id: null,
          subscription_expires_at: null,
        });
      },
    });
  }

  async getServicesWithNullSubscriptions(): Promise<ConnectedService[]> {
    return this.context.connectedServicesService.get({
      filter: {
        subscription_expires_at: { is: null },
      },
      columns: "*, credential:credentials(id, provider)",
    });
  }

  async resubscribeServices(
    services: ConnectedService[],
    expirationDate: string
  ) {
    return processInBatches({
      items: services,
      batchSize: 5,
      processor: async (service) => {
        const provider = getWebhookProvider(service.credential!.provider);
        const accessToken = await this.oauthController.getRefreshedAccessToken(
          service.credential_id
        );

        const result = await provider.subscribeToWebhook({
          accessToken,
          expirationDate,
          clientState: service.client_state,
          webhookUrl: this.getWebhookUrl({
            tenant_id: service.tenant_id,
            connected_service_id: service.id,
          }),
          changeType: service.webhook_change_type,
          resource: service.webhook_resource,
          connected_service_id: service.id,
          tenant_id: service.tenant_id,
        });

        return {
          ...service,
          subscription_id: result.subscription_id,
          subscription_expires_at: result.subscription_expires_at,
        };
      },
    });
  }

  async persistUpdatedSubscriptions(items: { result: ConnectedService }[]) {
    await processInBatches({
      items,
      batchSize: 5,
      processor: async ({ result }) => {
        const { subscription_id, subscription_expires_at } = result;
        await this.context.connectedServicesService.update(result.id, {
          subscription_id,
          subscription_expires_at,
        });
      },
    });
  }
}

export { WebhookController };
