// NO_CHANGE

import SupabaseController from "locals/controllers/SupabaseController";
import RequestController from "locals/controllers/RequestController";
import FunctionController from "locals/controllers/FunctionController";
import type {
  IAiAgent,
  IContext,
  IFunction,
  IFunctionCall,
  IOpenAiFunction,
  IAiAgentFunction,
} from "../../../../src/types/aiAgents.js";
import OpenAIController from "locals/controllers/OpenAIController";
import Logger from "locals/utils/Logger.js";
import type { ChatMessage, OpenAiRole } from "../../../../src/types/chat.js";
import { RequestError } from "functions/shared/services/SupabaseService.js";

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

interface IConstructorParams {
  logger: Logger;
  supabaseController: typeof SupabaseController;
  openaiController: typeof OpenAIController;
  functionController: typeof FunctionController;
  requestController: typeof RequestController;
}

interface SendMessageArgs {
  newMessage: ChatMessage;
  conversationId: string;
  agentId: string;
}

class AgentController {
  private supabaseController: typeof SupabaseController;
  private functionController: typeof FunctionController;
  private requestController: typeof RequestController;
  private openaiController: typeof OpenAIController;
  private agents: IAiAgent[];
  private logger: Logger;

  constructor({
    logger,
    supabaseController,
    openaiController,
    functionController,
    requestController,
  }: IConstructorParams) {
    this.logger = logger;
    this.supabaseController = supabaseController;
    this.openaiController = openaiController;
    this.functionController = functionController;
    this.requestController = requestController;
    // state
    this.agents = [];
  }

  get supabase() {
    return this.supabaseController.supabase;
  }

  async getAgents() {
    if (!this.supabase) {
      this.requestController.throwError(
        "SupabaseController not initialized",
        500
      );
    }

    const { data, error } = await this.supabase.from(TABLE_NAME).select("*");

    if (error) {
      this.requestController.throwError("Error fetching agents:", error);
    }

    this.agents = data;

    return data;
  }

  async getCurrentAgent(agentId: string): Promise<IAiAgent | undefined> {
    const agents = await this.getAgents();

    const agent = agents.find((agent: IAiAgent) => agent.id === agentId);

    return agent;
  }

  getAgentById(agentId: string): IAiAgent {
    const agent = this.agents.find((agent: IAiAgent) => agent.id === agentId);

    return agent || defaultAgent;
  }

  async getAgentFunctions(agentId: string) {
    if (!this.supabase) {
      this.requestController.throwError(
        "SupabaseController not initialized",
        500
      );
    }

    try {
      const { data, error } = await this.supabase
        .from("agent_functions")
        .select("function_id")
        .eq("agent_id", agentId);

      if (error) {
        this.requestController.throwError(
          "Error fetching agent functions:",
          error
        );
      }

      // Extract function IDs
      const functionIds = data.map(
        (item: IAiAgentFunction) => item.function_id
      );

      return functionIds;
    } catch (error) {
      this.logger.error(
        "Error fetching agent functions:",
        error as RequestError
      );
      return [];
    }
  }

  async buildAgentPrompt(agentId: string, context: IContext) {
    const { functions, session } = context;
    const { prompt, human_name, name } = this.getAgentById(agentId);

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

    if (error) {
      this.requestController.throwError("Error fetching messages:", error);
    }

    return data.map((message: ChatMessage) => ({
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
      this.logger.error(
        "Error in AgentController.getRequestArgs:",
        error as RequestError
      );
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

      const stream = await this.openaiController.streamAndCallFunction({
        onFunctionCall: (functionCall) =>
          this.functionController.executeFunction(functionCall),
        requestArgs,
      });

      return this.requestController.sendStreamResponse(stream);
    } catch (error) {
      this.requestController.throwError(
        "Error in AgentController.talkToAgent:",
        error as RequestError
      );
    }
  }

  async messageAgent({ conversationId, agentId, newMessage }: SendMessageArgs) {
    try {
      const requestArgs = await this.getRequestArgs({
        conversationId,
        agentId,
        newMessage,
      });

      const response = await this.openaiController.callOpenAIChatCompletion({
        ...requestArgs,
        stream: false,
      });

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

        const response2 = await this.openaiController.callOpenAIChatCompletion({
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
      this.requestController.throwError(
        "Error in AgentController.messageAgent:",
        error as RequestError
      );
    }
  }
}

export { AgentController };
export default new AgentController({
  logger: new Logger({ name: "AgentController" }),
  supabaseController: SupabaseController,
  openaiController: OpenAIController,
  functionController: FunctionController,
  requestController: RequestController,
});
