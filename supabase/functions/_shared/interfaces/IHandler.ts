import { RequestHandlerResponse } from "@/middleware/withRequestHandlers";

// interfaces/IWebhookProvider.ts
export interface IHandler<Context> {
  handle(req: Request, context: Context): RequestHandlerResponse;
}
