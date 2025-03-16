import {
  createClient,
  SupabaseClient,
  // @ts-ignore
} from "https://esm.sh/@supabase/supabase-js@2.8.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "RequestError";
  }
}

class SupabaseService {
  private _supabase: SupabaseClient;
  private authHeader: string | null;

  constructor() {
    this._supabase;
    this.authHeader = null;
  }

  async getUser() {
    if (!this._supabase) {
      throw new RequestError("Supabase client not initialized", 500);
    }

    const { data, error } = await this._supabase.auth.getUser();

    return data;
  }

  get supabase() {
    return this._supabase;
  }

  initializeSupabase({ url, key }: { url: string; key: string }) {
    this._supabase = createClient(url, key, {
      global: { headers: { Authorization: this.authHeader } },
    });
  }

  checkAuthHeaderPresent(req: Request) {
    const authHeader = req.headers.get("Authorization");

    this.authHeader = authHeader;

    if (!authHeader) {
      throw new RequestError("Authorization header is required", 401);
    }
  }

  sendPreflightResponse() {
    return new Response(null, { headers: corsHeaders });
  }

  sendJsonResponse(data: any, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
}

export default SupabaseService;
