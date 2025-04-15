// interfaces/IWebhookProvider.ts

export interface IWebhookProviderSubscribeParams {
  tenant_id: string;
  connected_service_id: string;
  accessToken: string;
  clientState: string;
  webhookUrl: string;
  changeType: string;
  resource: string;
  expirationDate: string;
}
export interface IWebhookProvider {
  supports_refresh: boolean;

  subscribeToWebhook(params: IWebhookProviderSubscribeParams): Promise<{
    subscription_id: string;
    subscription_expires_at: string;
  }>;
  refreshWebhookSubscription(params: {
    accessToken: string;
    subscriptionId: string;
    expirationDate: string;
  }): Promise<{
    subscription_id: string;
    subscription_expires_at: string;
  }>;
  // Some providers don't support refresh

  unsubscribeFromWebhook(params: {
    accessToken?: string;
    subscriptionId?: string;
    tenant_id?: string;
    connected_service_id?: string;
  }): Promise<void | boolean>;
}
