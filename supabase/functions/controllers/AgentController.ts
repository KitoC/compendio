// NO_CHANGE

// @ts-expect-error - Supabase client is not typed
import type { SupabaseClient } from "supabase-js";
import type SupabaseService from "../shared/services/SupabaseService";
import type FunctionController from "./FunctionController";
import type {
  IAiAgent,
  IContext,
  IFunctionCall,
  IOpenAiFunction,
} from "../../../src/types/aiAgents";
import type OpenAIService from "../shared/services/OpenAIService";
import type { ChatMessage, OpenAiRole } from "../../../src/types/chat";
import type Logger from "../shared/utils/logger.ts";

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

interface SetupDependenciesArgs {
  supabaseService: SupabaseService;
  openAiService: OpenAIService;
  functionController: FunctionController;
}

interface IConstructorParams {
  logger: Logger;
}

interface SendMessageArgs {
  newMessage: ChatMessage;
  conversationId: string;
  agentId: string;
}

class AgentController {
  private supabase: SupabaseClient | null;
  private supabaseService: SupabaseService;
  private functionController: FunctionController;
  private agents: IAiAgent[];
  private openAiService: OpenAIService;
  private logger: Logger;

  constructor({ logger }: IConstructorParams) {
    this.logger = logger;
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
      const functionIds = data.map((item) => item.function_id);
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
  }: SetupDependenciesArgs) {
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

  async getLastNMessages(conversationId: string, n: number) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(n);

    return data.map((message) => ({
      role: message.role as OpenAiRole,
      content: message.content,
    }));
  }

  async getRequestArgs({
    conversationId,
    agentId,
    newMessage,
  }: SendMessageArgs) {
    try {
      const { prompt, model = "gpt-4o-mini" } = await this.getAgentById(
        agentId
      );

      // Get function IDs associated with this agent
      const agentFunctionIds = await this.getAgentFunctions(agentId);

      // Get all available functions
      const allFunctions =
        (await this.functionController.getFunctions()) as IOpenAiFunction[];

      // Filter functions to only include those associated with this agent
      // If no specific functions are associated, use all functions
      const functions =
        agentFunctionIds.length > 0
          ? allFunctions.filter((fn) => agentFunctionIds.includes(fn.name))
          : allFunctions;

      const agentPrompt = await this.buildAgentPrompt(agentId, {
        functions,
        session: "",
      });

      const LAST_N = 10; // TODO: make this dynamic

      const messages = await this.getLastNMessages(conversationId, LAST_N);

      const cleanedMessages = [
        ...(agentPrompt ? [{ role: "system", content: agentPrompt }] : []),
        ...messages.slice(Math.max(messages.length - LAST_N, 0)),
        newMessage,
      ]
        .filter((message) => VALID_ROLES.includes(message?.role))
        .map((message) => ({
          role: message.role as OpenAiRole,
          content: message.content?.text || JSON.stringify(message.content),
        }));

      return {
        messages: cleanedMessages,
        model,
        functions,
      };
    } catch (error) {
      this.logger.error("Error in AgentController.getRequestArgs:", error);
      throw error;
    }
  }

  async talkToAgent({ newMessage, conversationId, agentId }: SendMessageArgs) {
    try {
      const requestArgs = await this.getRequestArgs({
        conversationId,
        agentId,
        newMessage,
      });

      const stream = await this.openAiService.streamAndCallFunction({
        onFunctionCall: (functionCall) =>
          this.functionController.executeFunction(functionCall),
        requestArgs,
      });

      return this.supabaseService.sendStreamResponse(stream);
    } catch (error) {
      this.logger.error("Error in AgentController.talkToAgent:", error);
      throw error;
    }
  }

  async messageAgent({ conversationId, agentId, newMessage }: SendMessageArgs) {
    try {
      const requestArgs = await this.getRequestArgs({
        conversationId,
        agentId,
        newMessage,
      });

      const response = await this.openAiService.callOpenAIChatCompletion({
        ...requestArgs,
        stream: false,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `OpenAI API error (${response.status}): ${errorText}`;

        this.logger.error(errorMessage);

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // response.choices[0].message.content
      const aiMessage = data.choices[0].message;

      let textResponse = aiMessage.content;
      let functionCall: IFunctionCall | null = null;

      if (aiMessage?.function_call) {
        functionCall = {
          name: aiMessage.function_call.name,
          arguments: aiMessage.function_call.arguments
            ? JSON.parse(aiMessage.function_call.arguments)
            : {},
        };

        const response2 = await this.openAiService.callOpenAIChatCompletion({
          ...requestArgs,
          messages: [
            ...requestArgs.messages,
            {
              role: "system" as OpenAiRole,
              content:
                "You have called the function. Respond in a friendly manner and do NOT format the message with any markdown.",
            },
          ],
          functions: undefined,
          stream: false,
        });

        const data2 = await response2.json();

        textResponse = data2.choices[0].message.content;
      }

      this.logger.debug("TEXT RESPONSE", textResponse);

      return { textResponse, functionCall };
    } catch (error) {
      this.logger.error("Error in AgentController.messageAgent:", error);
      throw error;
    }
  }
}

export default AgentController;
