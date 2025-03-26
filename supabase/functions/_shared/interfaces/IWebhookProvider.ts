// interfaces/IWebhookProvider.ts
export interface IWebhookProvider {
  subscribeToWebhook(params: {
    tenant_id: string;
    connected_service_id: string;
    accessToken: string;
    clientState: string;
    webhookUrl: string;
    changeType: string;
    resource: string;
  }): Promise<{
    subscription_id: string;
    subscription_expires_at: string;
  }>;
}
