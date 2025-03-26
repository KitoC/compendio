// providers/WebhookProviderRegistry.ts
import { AzureWebhookProvider } from "locals/providers/AzureWebhookProvider";
import { IWebhookProvider } from "locals/interfaces/IWebhookProvider";

const providerMap: Record<string, IWebhookProvider> = {
  azure: new AzureWebhookProvider(),
  // gmail: new GmailWebhookProvider(),
};

export function getWebhookProvider(provider: string): IWebhookProvider {
  const found = providerMap[provider];

  if (!found) {
    throw new Error(`Webhook provider not supported: ${provider}`);
  }
  return found;
}
