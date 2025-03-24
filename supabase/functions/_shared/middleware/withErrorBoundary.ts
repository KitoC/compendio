import { RequestError } from "locals/controllers/RequestController";
import Logger from "locals/utils/Logger";

const logger = new Logger({ name: "Request Handler" });

const sendError = (error: RequestError) => {
  logger.error(error?.message || "An unknown error occurred", error);

  return new Response(JSON.stringify(error), {
    status: error?.status || 500,
    headers: { "Content-Type": "application/json" },
  });
};

export const withErrorBoundary = (
  handler: (req: Request) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (e) {
      return sendError(e as RequestError);
    }
  };
};
