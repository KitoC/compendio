// NO_CHANGE
import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

type CreateWebhookEventArgs = {
  source: string;
  event_type: string;
  payload: unknown;
  headers: Record<string, string>;
  connected_service_id: string;
  tenant_id: string;
};

export interface ConnectedService {
  id: string;
  name: string;
  service_type: string;
  active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  credential_id: string;
  client_state: string;
  subscription_id: string;
  subscription_expires_at: string;
  webhook_change_type: string;
  webhook_resource: string;
  agent_id: string;
}

export type UpdateConnectedServiceArgs = {
  id: string;
  subscription_id: string;
  subscription_expires_at: string;
};

class ConnectedServicesService extends BaseSupabaseService {
  constructor(public req: Request, public context: BaseRequiredContext) {
    super(context);
  }

  async getConnectedService(connected_service_id: string) {
    console.log("getConnectedService", connected_service_id);
    const { data, error } = await this.supabase
      .from("connected_services")
      .select("*")
      .eq("id", connected_service_id)
      .single();

    if (error) {
      this.throwError("Error getting connected service", error, 500);
    }

    return data;
  }

  async createWebhookEvent(args: CreateWebhookEventArgs) {
    const insert = await this.supabase.from("webhook_events").insert({
      source: args.source,
      event_type: args.event_type,
      payload: args.payload,
      headers: args.headers,
      connected_service_id: args.connected_service_id,
      tenant_id: args.tenant_id,
    });

    if (insert.error) {
      this.throwError("Error creating webhook event", insert.error, 500);
    }

    return insert.data;
  }

  async updateConnectedService(args: UpdateConnectedServiceArgs) {
    const update = await this.supabase
      .from("connected_services")
      .update(args)
      .eq("id", args.id);

    if (update.error) {
      this.throwError("Error updating connected service", update.error, 500);
    }

    return update.data;
  }
}

export { ConnectedServicesService };
