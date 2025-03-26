// providers/AzureWebhookProvider.ts
import { ProviderError } from "locals/error-types";
import { IWebhookProvider } from "locals/interfaces/IWebhookProvider";
import { withRetry } from "locals/utils/withRetry";

const AZURE_GRAPH_API_URL = "https://graph.microsoft.com/v1.0/subscriptions";

export class AzureWebhookProvider implements IWebhookProvider {
  async subscribeToWebhook({
    accessToken,
    clientState,
    webhookUrl,
    changeType = "created",
    resource = "me/mailFolders('inbox')/messages",
  }: {
    accessToken: string;
    clientState: string;
    webhookUrl: string;
    changeType: string;
    resource: string;
  }) {
    const now = new Date();
    const expires = new Date(now.getTime() + 11 * 60 * 60 * 1000).toISOString();

    console.log("webhookUrl", webhookUrl);
    const res = await withRetry(() =>
      fetch(AZURE_GRAPH_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType,
          notificationUrl: webhookUrl,
          resource,
          expirationDateTime: expires,
          clientState,
        }),
      })
    );

    const json = await res.json();

    if (!res.ok) {
      throw new ProviderError(
        "AzureWebhookProvider",
        `Azure subscription failed`,
        500,
        json
      );
    }

    return {
      subscription_id: json.id,
      subscription_expires_at: json.expirationDateTime,
    };
  }
}
