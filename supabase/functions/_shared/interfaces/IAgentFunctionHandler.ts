import { PublicContext } from "@/middleware/withPublicContext";
import type { IFunction } from "@/types/aiAgents";

export interface IAgentFunctionHandlerResult {
  result: object | null;
  functionMessage: string;
}

export interface IAgentFunctionHandler {
  handle(payload: unknown, fn: IFunction): Promise<IAgentFunctionHandlerResult>;
}
