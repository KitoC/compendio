import { IFunctionCall } from "@/types/aiAgents";
import { SupabaseFunctionService } from "./supabaseFunctionServices";

export const FunctionService = {
  async triggerManualFunction(agent_id: string, function_call: IFunctionCall) {
    const response = await SupabaseFunctionService.post("wss-functions", {
      agent_id,
      function_call,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  },
};
