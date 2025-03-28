// NO_CHANGE
import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";
import { getEnvKey } from "locals/utils/env";

class FunctionQueueService extends BaseSupabaseService {
  constructor(public req: Request, public context: BaseRequiredContext) {
    super(context);
    this.tableName = "messages";
  }

  async enqueueTask(action: string, payload: unknown) {
    const { data, error } = await this.supabase.rpc("enqueue_function_task", {
      _action: action,
      _payload: JSON.stringify(payload),
      _encryption_key: getEnvKey("ENCRYPTION_KEY"),
    });

    if (error) {
      this.throwError("Failed to enqueue task", 500);
    }

    return data;
  }
}

export { FunctionQueueService };
