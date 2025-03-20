// NO_CHANGE

import Logger from "locals/utils/Logger";

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

// edge-function.ts

class RequestController {
  private authHeader: string | null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ name: "RequestController" });

    this.authHeader = null;
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
    return new Response(null, { headers: corsHeaders });
  }

  sendJsonResponse(data: object, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendError(error?: RequestError) {
    this.logger.error(error?.message || "An unknown error occurred", error);
    console.log("sendError", error?.message);

    return new Response(JSON.stringify({ error: error?.message }), {
      status: error?.status || 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  sendStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
}

export { RequestController };
export default new RequestController();
