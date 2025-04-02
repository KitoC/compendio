import Logger from "locals/utils/Logger";

const defaultCorsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id",
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
      const logger = new Logger({ name: "withCors" });
      const { allowedOrigins, corsHeaders } = { ...defaultParams, ...params };

      const origin = req.headers.get("origin");

      if (origin && !allowedOrigins?.includes(origin)) {
        console.log("Forbidden: invalid origin", origin);
        logger.debug("Forbidden: invalid origin", origin);

        return new Response("Forbidden: invalid origin", { status: 403 });
      }

      const headers = {
        ...(corsHeaders || defaultCorsHeaders),
        "Access-Control-Allow-Origin": origin || "*",
      };

      if (req.method === "OPTIONS") {
        logger.debug("SENDING PRE-FLIGHT RESPONSE", headers);
        return new Response(null, {
          status: 204,
          headers,
        });
      }

      return await handler(req, {
        ...context,
        allowedOrigins: allowedOrigins || defaultAllowedOrigins,
        corsHeaders: headers,
      });
    };
}
