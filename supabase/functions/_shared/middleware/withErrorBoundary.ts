import { RequestError } from "locals/controllers/RequestController";
import Logger from "locals/utils/Logger";
import { CorsContext } from "locals/middleware/withCors";

const logger = new Logger({ name: "Request Handler" });

const sendError = (error: RequestError, headers: HeadersInit) => {
  logger.debug("SENDING ERROR RESPONSE", headers);

  logger.error(error?.message || "An unknown error occurred", error);

  return new Response(JSON.stringify(error), {
    status: error?.status || 500,
    headers: { ...headers, "Content-Type": "application/json" },
  });
};

export type ErrorBoundaryChildHandler = (
  req: Request,
  context: CorsContext
) => Promise<Response>;

export const withErrorBoundary = (handler: ErrorBoundaryChildHandler) => {
  return async (req: Request, context: CorsContext): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (e) {
      return sendError(e as RequestError, context.corsHeaders);
    }
  };
};
