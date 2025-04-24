// NO_CHANGE

import Logger from "@/utils/Logger";

// CORS headers for cross-origin requests

export class RequestError extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "RequestError";
  }
}

// edge-function.ts

class RequestController {
  public logger: Logger;
  public corsHeaders: object;

  constructor() {
    this.logger = new Logger({ name: "RequestController" });

    this.corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(new RequestError(message, status, errorOrStatus));
    } else {
      this.logger.throwAndLog(new RequestError(message, errorOrStatus));
    }
  }

  checkAuthHeaderPresent(req: Request) {
    // Extract the Authorization header
    if (!req.headers.get("Authorization")) {
      this.throwError("Authorization header is required", 401);
    }
  }

  sendPreflightResponse() {
    return new Response(null, { headers: this.corsHeaders as HeadersInit });
  }

  sendJsonResponse(data: object, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...this.corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendError(error?: RequestError) {
    this.logger.error(error?.message || "An unknown error occurred", error);

    return new Response(JSON.stringify({ error: error?.message }), {
      status: error?.status || 500,
      headers: { ...this.corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: { ...this.corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
}

export { RequestController };
export default new RequestController();
