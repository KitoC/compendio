// @ts-ignore
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import type SupabaseService from "../shared/services/SupabaseService";
import type FunctionController from "./FunctionController";

const TABLE_NAME = "ai_agents";

class AgentController {
  private supabase: SupabaseClient | null;
  private supabaseService: SupabaseService;
  private functionController: FunctionController;
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
    functionController,
  }: {
    supabaseService: SupabaseService;
    openAiService: any;
    functionController: FunctionController;
  }) {
    this.supabaseService = supabaseService;
    this.supabase = supabaseService.supabase;
    this.openAiService = openAiService;
    this.functionController = functionController;

    return this.getAgents();
  }

  async buildAgentPrompt(agentId: string, context: any) {
    const { functions, session } = context;
    const { prompt, human_name, name } = await this.getAgentById(agentId);

    let interpolatedPrompt = prompt;

    [
      {
        variable: "{{FUNCTIONS}}",
        replacement: () =>
          functions.map((fn) => `**${fn.name}:** ${fn.description}`).join("\n"),
      },
      {
        variable: "{{AI_NAME}}",
        replacement: () => human_name || name,
      },
      {
        variable: "{{SESSION}}",
        replacement: () => session,
      },
    ].forEach(({ variable, replacement }) => {
      interpolatedPrompt = interpolatedPrompt.replace(variable, replacement());
    });

    return interpolatedPrompt;
  }

  async talkToAgent(messages: any[], agentId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.getAgentById(agentId);

    const functions = await this.functionController.getFunctions();
    const agentPrompt = await this.buildAgentPrompt(agentId, { functions });

    try {
      const LAST_N = 10; // TODO: make this dynamic

      const stream = await this.openAiService.streamAndCallFunction({
        supabaseService: this.supabaseService,
        onFunctionCall: (functionCall) =>
          this.functionController.executeFunction(functionCall),
        requestArgs: {
          messages: [
            ...(agentPrompt ? [{ role: "system", content: agentPrompt }] : []),
            ...messages.slice(Math.max(messages.length - LAST_N, 0)),
          ].filter(Boolean),
          model,
          functions,
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
