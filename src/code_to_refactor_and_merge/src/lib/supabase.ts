import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENDPOINTS } from "../config/endpoints";

export interface ChatWidgetConfig {
  chatUrl?: string;
  logo?: string;
  avatarUrl?: string;
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
  position?:
    | "bottom-left"
    | "bottom-right"
    | "top-left"
    | "top-right"
    | "left"
    | "right";
  previousConversations: {
    persistIfLessThan: string;
  };
}

export interface AppConfig {
  chatWidgetConfig: ChatWidgetConfig;
  config: { tools: object[] };
}
export interface CompanyConfig {
  tools: object[];
}

export type SupabaseEnv = {
  supabaseUrl: string;
  backendUrl: string;
  apiKey: string;
};

export const makeSupabaseClient = (env: SupabaseEnv) => {
  const customFetch = async (
    input: RequestInfo | URL,
    options: RequestInit = {}
  ) => {
    const url = typeof input === "string" ? input : input.toString();

    const response = await fetch(`${env.backendUrl}${ENDPOINTS.PROXY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.apiKey}`,
        "x-api-key": env.apiKey,
        "x-proxy-cache": "false",
      },
      body: JSON.stringify({
        method: options.method,
        headers: {
          ...options.headers,
          Authorization: "Bearer {{SUPABASE_SERVICE_ROLE_KEY}}",
          Apikey: "{{SUPABASE_SERVICE_ROLE_KEY}}",
        },
        url,
        body: options.body ? JSON.parse(options.body as string) : null,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  return createClient(env.supabaseUrl, "key", {
    auth: {
      persistSession: true,
    },
    global: {
      fetch: customFetch,
    },
  });
};

class SupabaseManager {
  private supabase: SupabaseClient;
  private env: SupabaseEnv;
  private _tenantId: string;

  constructor(env: SupabaseEnv) {
    this.env = env;
    this.supabase = makeSupabaseClient(this.env);
    this._tenantId = "";
  }
  get tenantId() {
    return this._tenantId;
  }

  set tenantId(tenantId: string) {
    this._tenantId = tenantId;
  }
  // Get the current Supabase instance
  getClient() {
    return this.supabase;
  }

  // Change the API key (recreates the client)
  setApiKey(newApiKey: string) {
    if (this.env.apiKey !== newApiKey) {
      this.env.apiKey = newApiKey;
      console.log("Updating Supabase API Key...");
      this.supabase = makeSupabaseClient(this.env);
    }
  }
}

// Usage example
const env = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || "backend-url",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "supabase-url",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "supabase-key",
  apiKey: import.meta.env.VITE_SKYBROOK_API_KEY || "api-key",
};

const supabaseManager = new SupabaseManager(env);

export default supabaseManager;

export const createCompanySupabaseClient = (env: {
  url: string;
  key: string;
}) => {
  return createClient(env.url, env.key, { auth: { persistSession: true } });
};
