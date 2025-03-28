import { PublicContext } from "locals/middleware/withPublicContext";

export interface ITaskHandler {
  handle(payload: unknown, context: PublicContext): Promise<unknown>;
}
