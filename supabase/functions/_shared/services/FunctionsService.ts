// NO_CHANGE
import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";
import { getEnvKey } from "@/utils/env";

interface IArgs {
  query?:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined;
  body?: Record<string, unknown>;
  method?: string;
  headers: HeadersInit;
}

class FunctionsService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "messages";
  }

  async callFunction(action: string, args: IArgs) {
    const { query, body, method = "POST", headers = {} } = args;

    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";

    const mergedHeaders = { ...headers, "Content-Type": "application/json" };

    const baseFunctionsUrl =
      getEnvKey("FUNCTIONS_URL") || getEnvKey("SUPABASE_URL");

    const url = `${baseFunctionsUrl}/functions/v1/${action}${queryString}`;

    this.logger.debug("calling function url --> ", url);

    return fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: mergedHeaders,
    });
  }
}

export { FunctionsService };
