// providers/GmailWebhookProvider.ts
import { ProviderError } from "locals/error-types";
import {
  IWebhookProvider,
  IWebhookProviderSubscribeParams,
} from "locals/interfaces/IWebhookProvider";
import { GoogleCloudHelper } from "locals/utils/GoogleCloudHelper";
import Logger from "locals/utils/Logger";

const GOOGLE_GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1";
const GOOGLE_PUBSUB_API_URL = "https://pubsub.googleapis.com/v1";

const logger = new Logger({ name: "GmailWebhookProvider" });
const projectId = "skybrookai";
const topicName = "gmail";
export class GmailWebhookProvider implements IWebhookProvider {
  supports_refresh = false;

  async subscribeToWebhook({
    accessToken,
    clientState,
    webhookUrl,
    changeType,
    resource,
    expirationDate,
    connected_service_id,
    tenant_id,
  }: IWebhookProviderSubscribeParams) {
    // TODO: Make this configurable

    const fullTopicName = `projects/${projectId}/topics/${topicName}`;
    const subscriptionId = `gmail-sub_${tenant_id}_${connected_service_id}`;
    const fullSubscriptionName = `projects/${projectId}/subscriptions/${subscriptionId}`;

    const cloudHelper = new GoogleCloudHelper();
    // 1. Clean up existing subscription if it exists
    const pubsubToken = await cloudHelper.getServiceAccountAccessToken();

    await fetch(`${GOOGLE_PUBSUB_API_URL}/${fullSubscriptionName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${pubsubToken}`,
      },
    });

    // 2. Create new Pub/Sub push subscription
    const createSubRes = await fetch(
      `${GOOGLE_PUBSUB_API_URL}/${fullSubscriptionName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${pubsubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: fullTopicName,
          pushConfig: {
            pushEndpoint: webhookUrl,
          },
          ackDeadlineSeconds: 10,
        }),
      }
    );

    const subJson = await createSubRes.json();

    if (!createSubRes.ok) {
      throw new ProviderError(
        "GmailWebhookProvider",
        "Failed to create Pub/Sub subscription",
        createSubRes.status,
        subJson
      );
    }

    logger.info("✅ Pub/Sub subscription created:", subJson.name);

    // 3. Register Gmail watch
    const gmailWatchRes = await fetch(
      `${GOOGLE_GMAIL_API_URL}/users/me/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: fullTopicName,
          labelIds: ["INBOX"],
          labelFilterAction: "include",
        }),
      }
    );

    const gmailJson = await gmailWatchRes.json();

    if (!gmailWatchRes.ok) {
      throw new ProviderError(
        "GmailWebhookProvider",
        "Failed to subscribe to Gmail Pub/Sub",
        gmailWatchRes.status,
        gmailJson
      );
    }

    logger.info("📩 Gmail watch registered:", gmailJson);

    return {
      subscription_id: gmailJson.historyId,
      subscription_expires_at: new Date(
        Number(gmailJson.expiration)
      ).toISOString(),
    };
  }

  async refreshWebhookSubscription() {
    return {
      subscription_id: "",
      subscription_expires_at: "",
    };
  }

  async unsubscribeFromWebhook({
    connected_service_id,
    tenant_id,
  }: {
    connected_service_id: string;
    tenant_id: string;
  }): Promise<boolean> {
    const subscriptionId = `gmail-sub--${tenant_id}--${connected_service_id}`;
    const fullSubscriptionName = `projects/${projectId}/subscriptions/${subscriptionId}`;

    const cloudHelper = new GoogleCloudHelper();

    const pubsubToken = await cloudHelper.getServiceAccountAccessToken();

    const res = await fetch(
      `${GOOGLE_PUBSUB_API_URL}/${fullSubscriptionName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${pubsubToken}`,
        },
      }
    );

    if (res.status === 204 || res.status === 200) {
      logger.info(`✅ Deleted Pub/Sub subscription: ${subscriptionId}`);
      return true;
    } else if (res.status === 404) {
      logger.warn(
        `⚠️ Pub/Sub subscription not found during delete: ${subscriptionId}`
      );
      return true;
    } else {
      const error = await res.json();
      logger.error("❌ Failed to delete Pub/Sub subscription", error);
      throw new ProviderError(
        "GmailWebhookProvider",
        "Failed to delete Pub/Sub subscription",
        res.status,
        error
      );
    }
  }
}
