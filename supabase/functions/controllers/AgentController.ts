
// @ts-expect-error - Supabase client is not typed
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import type SupabaseService from "../shared/services/SupabaseService";
import type FunctionController from "./FunctionController";
import type {
  IAiAgent,
  IContext,
  IOpenAiFunction,
} from "../../../src/types/aiAgents";
import type OpenAIService from "../shared/services/OpenAIService";
import type { ChatMessage, OpenAiRole } from "../../../src/types/chat";

const TABLE_NAME = "ai_agents";

const defaultAgent: IAiAgent = {
  id: "default",
  name: "Default Agent",
  human_name: "Default Agent",
  responsibility: "Default Agent",
  enabled: true,
  prompt: "",
  model: "gpt-4o-mini",
  avatar_url: "",
  tenant_id: "",
  created_at: "",
  updated_at: "",
};

const VALID_ROLES = ["user", "assistant", "function", "system"];

class AgentController {
  private supabase: SupabaseClient | null;
  private supabaseService: SupabaseService;
  private functionController: FunctionController;
  private agents: IAiAgent[];
  private openAiService: OpenAIService;

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

    return agent || defaultAgent;
  }

  async getAgentFunctions(agentId: string) {
    if (!this.supabase) {
      throw new Error("Supabase client not initialized");
    }

    try {
      const { data, error } = await this.supabase
        .from("agent_functions")
        .select("function_id")
        .eq("agent_id", agentId);

      if (error) {
        throw new Error(error.message);
      }

      // Extract function IDs
      const functionIds = data.map(item => item.function_id);
      return functionIds;
    } catch (error) {
      console.error("Error fetching agent functions:", error);
      return [];
    }
  }

  async setDependenciesAndGetAgents({
    supabaseService,
    openAiService,
    functionController,
  }: {
    supabaseService: SupabaseService;
    openAiService: OpenAIService;
    functionController: FunctionController;
  }) {
    this.supabaseService = supabaseService;
    this.supabase = supabaseService.supabase;
    this.openAiService = openAiService;
    this.functionController = functionController;

    return this.getAgents();
  }

  async buildAgentPrompt(agentId: string, context: IContext) {
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

  async talkToAgent(messages: ChatMessage[], agentId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.getAgentById(agentId);

    // Get function IDs associated with this agent
    const agentFunctionIds = await this.getAgentFunctions(agentId);
    
    // Get all available functions
    const allFunctions = await this.functionController.getFunctions() as IOpenAiFunction[];
    
    // Filter functions to only include those associated with this agent
    // If no specific functions are associated, use all functions
    const functions = agentFunctionIds.length > 0 
      ? allFunctions.filter(fn => agentFunctionIds.includes(fn.name))
      : allFunctions;

    const agentPrompt = await this.buildAgentPrompt(agentId, {
      functions,
      session: "",
    });

    try {
      const LAST_N = 10; // TODO: make this dynamic

      const cleanedMessages = [
        ...(agentPrompt ? [{ role: "system", content: agentPrompt }] : []),
        ...messages.slice(Math.max(messages.length - LAST_N, 0)),
      ]
        .filter((message) => VALID_ROLES.includes(message?.role))
        .map((message) => ({
          role: message.role as OpenAiRole,
          content: message.content as string,
        }));

      const stream = await this.openAiService.streamAndCallFunction({
        onFunctionCall: (functionCall) =>
          this.functionController.executeFunction(functionCall),
        requestArgs: {
          messages: cleanedMessages,
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
