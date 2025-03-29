import Logger from "locals/utils/Logger";
import { RequestError } from "locals/controllers/RequestController";
import { getEnvKey } from "locals/utils/env";
import { CorsContext } from "locals/middleware/withCors";

export type RequestHandlerResponse = {
  body: BodyInit | null;
  headers: HeadersInit;
  status: number;
};

export type RequestChildHandler<Context> = (
  req: Request,
  context: Context
) => Promise<RequestHandlerResponse>;

export function withRequestHandlers<Context extends CorsContext>(
  handler: RequestChildHandler<Context>
) {
  return async (req: Request, context: Context): Promise<Response> => {
    const { corsHeaders } = context;

    const logger = new Logger({ name: "RequestAudit" });

    const start = performance.now();
    const method = req.method;
    const path = new URL(req.url).pathname;
    const isMutation = ["POST", "PATCH", "DELETE"].includes(method);
    const shouldLog = getEnvKey("LOG_ALL_REQUESTS") || isMutation;

    try {
      const res = await handler(req, context);

      if (!res) {
        return new Response("No response from handler", { status: 500 });
      }

      const headers = corsHeaders;

      // @ts-expect-error Headers is not typed
      res.headers.forEach((value, key) => {
        // @ts-expect-error Headers is not typed
        headers.set(key, value);
      });

      const duration = `${(performance.now() - start).toFixed(2)}ms`;

      if (shouldLog) {
        logger.info("Request handled", {
          method,
          path,
          status: res.status,
          // @ts-expect-error Does not exist on context
          user_id: context?.authService?.user?.id || "anonymous",
          // @ts-expect-error Does not exist on context
          tenant_id: context?.authService?.tenantId || null,
          duration,
        });
      }

      if (res.status === 204 || res.status === 202) {
        return new Response(null, { status: res.status, headers });
      }

      return new Response(res.body, { status: res.status, headers });
    } catch (error) {
      const duration = `${(performance.now() - start).toFixed(2)}ms`;
      logger.error(
        "Request failed",
        new RequestError("Request failed", 500, {
          method,
          path,
          error,
          // @ts-expect-error Does not exist on context
          user_id: context?.authService?.user?.id || "anonymous",
          // @ts-expect-error Does not exist on context
          tenant_id: context?.authService?.tenantId || null,
          duration,
        })
      );

      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }
  };
}
