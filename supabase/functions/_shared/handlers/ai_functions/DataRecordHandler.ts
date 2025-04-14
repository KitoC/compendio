// ============================================
// DataRecordHandler.ts
// Handles 'get_record' and 'get_records' task type
// ============================================

import { PublicContext } from "locals/middleware/withPublicContext";

import Logger from "locals/utils/Logger";
import {
  IAgentFunctionHandler,
  IAgentFunctionHandlerResult,
} from "locals/interfaces/IAgentFunctionHandler";
import type { IFunction, IFunctionCall } from "@/types/aiAgents";

export interface ITaskPayload {
  message_id: string;
  conversation_id: string;
  agent_id: string;
  function_call: object;
}

export class DataRecordHandler implements IAgentFunctionHandler {
  logger: Logger;

  constructor(public context: PublicContext) {
    this.logger = new Logger({ name: "DataRecordHandler" });
  }

  async handle(
    fnCall: IFunctionCall,
    fn: IFunction
  ): Promise<IAgentFunctionHandlerResult> {
    this.logger.info("🔹 Getting data records");

    this.logger.debug("fnCall", fnCall);
    this.logger.debug("fn", JSON.stringify(fn));

    const {
      filter_formula,
      table_name,
      limit,
      offset = "0",
    } = fnCall.arguments as {
      filter_formula: string;
      table_name: string;
      limit: string;
      offset: string;
    };

    const result = await this.context.functionsService.callFunction(
      "table-records",
      {
        method: "GET",
        query: {
          ...(filter_formula ? { filterByFormula: filter_formula } : {}),
          table: table_name,
          limit,
          offset,
        },
        headers: this.context.corsHeaders,
      }
    );

    this.logger.debug("result", result);

    const json = await result.json();

    this.logger.debug("json", JSON.stringify(json));

    if (!result.ok) {
      return {
        result: fnCall.arguments,
        functionMessage: `There was an error retrieving the records: ${JSON.stringify(
          json
        )}`,
      };
    }

    return {
      result: json,
      functionMessage: `results: ${JSON.stringify(json)}`,
    };
  }
}
