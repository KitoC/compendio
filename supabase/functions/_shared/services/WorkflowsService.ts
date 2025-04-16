// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";
import { getEnvKey } from "@/utils/env";

class WorkflowsService extends BaseSupabaseService {
  n8n_api_key: string;

  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "workflows";
    this.n8n_api_key = getEnvKey("N8N_API_KEY");
  }
}

export { WorkflowsService };
