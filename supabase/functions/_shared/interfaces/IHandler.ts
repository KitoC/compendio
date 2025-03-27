import { RequestHandlerResponse } from "locals/middleware/withRequestHandlers";

// interfaces/IWebhookProvider.ts
export interface IHandler<Context> {
  handle(req: Request, context: Context): RequestHandlerResponse;
}
