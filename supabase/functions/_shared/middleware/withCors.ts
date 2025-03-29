const defaultCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const defaultAllowedOrigins = ["http://localhost:8080"];

type Params = {
  allowedOrigins?: string[];
  corsHeaders?: HeadersInit;
  logAllRequests?: boolean; // default false
};

export type CorsContext = {
  allowedOrigins: string[];
  corsHeaders: HeadersInit;
};

export const defaultParams: Params = {
  allowedOrigins: defaultAllowedOrigins,
  corsHeaders: defaultCorsHeaders,
  logAllRequests: false,
};

export type CorsChildHandler<Context> = (
  req: Request,
  context: Context & CorsContext
) => Promise<Response>;

export function withCors<Context>(params: Params = defaultParams) {
  return (handler: CorsChildHandler<Context>) =>
    async (req: Request, context: Context): Promise<Response> => {
      const { allowedOrigins, corsHeaders } = { ...defaultParams, ...params };

      const origin = req.headers.get("origin");

      if (origin && !allowedOrigins?.includes(origin)) {
        return new Response("Forbidden: invalid origin", { status: 403 });
      }

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders } });
      }

      const headers = new Headers(corsHeaders || defaultCorsHeaders);

      if (origin) {
        headers.set("Access-Control-Allow-Origin", origin);
      }

      return await handler(req, {
        ...context,
        allowedOrigins: allowedOrigins || defaultAllowedOrigins,
        corsHeaders: headers,
      });
    };
}
