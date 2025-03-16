// @ts-ignore
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import type SupabaseService from "../shared/services/SupabaseService";
const TABLE_NAME = "ai_agents";

class AgentController {
  private supabase: SupabaseClient | null;
  private supabaseService: SupabaseService;
  private agents: any[];
  private openAiService: any;
  constructor() {
    this.supabase = null;
    this.agents = [];
  }

  async getAgents() {
    if (!this.supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await this.supabase.from(TABLE_NAME).select("*");

    if (error) {
      throw new Error(error.message);
    }

    this.agents = data;

    return data;
  }

  async getCurrentAgent(agentId: string) {
    const agents = await this.getAgents();

    const agent = agents.find((agent) => agent.id === agentId);

    return agent;
  }

  async getAgentById(agentId: string) {
    const agent = this.agents.find((agent) => agent.id === agentId);

    return agent;
  }

  async setDependenciesAndGetAgents({
    supabaseService,
    openAiService,
  }: {
    supabaseService: SupabaseService;
    openAiService: any;
  }) {
    this.supabaseService = supabaseService;
    this.supabase = supabaseService.supabase;
    this.openAiService = openAiService;

    return this.getAgents();
  }

  async talkToAgent(messages: any[], agentId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.getAgentById(agentId);

    try {
      const LAST_N = 10; // TODO: make this dynamic

      const stream = await this.openAiService.streamAndCallFunction({
        supabaseService: this.supabaseService,
        onFunctionCall: (functionName: string, functionArgs: any) => {
          console.log("Function called:", functionName, functionArgs);
          return "The round hole of the earth is empty";
        },
        requestArgs: {
          messages: [
            {
              content: prompt || "", // TODO: add default prompt here at some stage
            },
            ...messages.slice(Math.max(messages.length - LAST_N, 0)),
          ],
          model,
          functions: [
            {
              name: "foo",
              description: "Call the foo",
            },
          ],
        },
      });

      return this.supabaseService.sendStreamResponse(stream);
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw error;
    }
  }
}

export default AgentController;
