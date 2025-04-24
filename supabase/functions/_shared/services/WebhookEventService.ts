// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";
import { getEnvKey } from "@/utils/env";

interface WebhookEvent {
  tenant_id: string;
  payload: unknown;
  headers: Headers;
  connected_service_id: string;
  status: string;
}

class WebhookEventService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "webhook_events";
  }

  async createWebhookEvent(webhookEvent: WebhookEvent) {
    const response = await this.supabase.rpc("log_webhook_event", {
      _tenant_id: webhookEvent.tenant_id,
      _payload: webhookEvent.payload,
      _headers: webhookEvent.headers,
      _connected_service_id: webhookEvent.connected_service_id,
      _status: webhookEvent.status,
      _encryption_key: getEnvKey("ENCRYPTION_KEY"),
    });

    if (response.error) {
      this.throwError("Error creating webhook event:", response.error);
    }

    return response.data;
  }
}

export { WebhookEventService };
