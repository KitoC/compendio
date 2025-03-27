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
    expirationDate,
  }: {
    accessToken: string;
    clientState: string;
    webhookUrl: string;
    changeType: string;
    resource: string;
    expirationDate: string;
  }) {
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
          expirationDateTime: expirationDate,
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

  refreshWebhookSubscription({
    accessToken,
    subscriptionId,
    expirationDate,
  }: {
    accessToken: string;
    subscriptionId: string;
    expirationDate: string;
  }) {
    return withRetry(async () => {
      const res = await fetch(`${AZURE_GRAPH_API_URL}/${subscriptionId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expirationDateTime: expirationDate,
        }),
      });

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
    });
  }

  async unsubscribeFromWebhook({
    accessToken,
    subscriptionId,
  }: {
    accessToken: string;
    subscriptionId: string;
  }): Promise<void | true> {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 204) {
      return true;
    }

    const error = await res.json();
    throw new ProviderError(
      "AzureWebhookProvider",
      "Failed to unsubscribe",
      res.status,
      error
    );
  }
}
