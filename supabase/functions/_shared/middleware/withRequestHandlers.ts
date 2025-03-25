import Logger from "locals/utils/Logger";
import { RequestError } from "locals/controllers/RequestController";

const defaultCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const defaultAllowedOrigins = ["http://localhost:8080"];

type Params = {
  allowedOrigins?: string[];
  corsHeaders?: HeadersInit;
};

export const defaultParams: Params = {
  allowedOrigins: defaultAllowedOrigins,
  corsHeaders: defaultCorsHeaders,
};

export function withOriginGuardedRequestHandler<Context>(
  params: Params = defaultParams
) {
  return (
      handler: (
        req: Request,
        context: Context
      ) => Promise<{
        body: BodyInit;
        headers: HeadersInit;
        status: number;
      } | void>
    ) =>
    async (req: Request, context: Context): Promise<Response> => {
      const {
        allowedOrigins = defaultAllowedOrigins,
        corsHeaders = defaultCorsHeaders,
      } = {
        ...defaultParams,
        ...params,
      };

      const origin = req.headers.get("origin");

      if (origin && !allowedOrigins.includes(origin)) {
        return new Response("Forbidden: invalid origin", { status: 403 });
      }

      // Handle HTTP preflight CORS
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: { ...corsHeaders },
        });
      }

      const res = await handler(req, context);

      if (!res) {
        return new Response("No response from handler", { status: 500 });
      }

      const headers = new Headers({ ...corsHeaders, ...res.headers });

      if (origin) {
        headers.set("Access-Control-Allow-Origin", origin);
      }

      return new Response(res.body, {
        status: res.status,
        headers,
      });
    };
}
