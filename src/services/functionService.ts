import { IFunctionCall } from "@/types/aiAgents";
import { SupabaseFunctionService } from "./supabaseFunctionServices";

export const FunctionService = {
  async triggerManualFunction(agent_id: string, function_call: IFunctionCall) {
    const response = await SupabaseFunctionService.post("wss-functions", {
      agent_id,
      function_call,
    });

    if (!response.ok) {
      const json = await response.json();

      throw json;
    }

    return response.json();
  },
};
