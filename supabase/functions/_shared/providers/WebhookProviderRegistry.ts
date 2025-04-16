// providers/WebhookProviderRegistry.ts
import { AzureWebhookProvider } from "@/providers/AzureWebhookProvider";
import { GmailWebhookProvider } from "@/providers/GmailWebhookProvider";
import { IWebhookProvider } from "@/interfaces/IWebhookProvider";

const providerMap: Record<string, IWebhookProvider> = {
  azure: new AzureWebhookProvider(),
  google_gmail: new GmailWebhookProvider(),
};

export function getWebhookProvider(
  provider: string,
  service_type: string
): IWebhookProvider {
  const found =
    providerMap[`${provider}_${service_type}`] || providerMap[provider];

  if (!found) {
    throw new Error(`Webhook provider not supported: ${provider}`);
  }
  return found;
}
