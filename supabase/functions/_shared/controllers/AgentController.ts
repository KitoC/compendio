// NO_CHANGE

import type {
  IAiAgent,
  IContext,
  IOpenAiFunction,
  IAiAgentFunction,
  IFunction,
} from "../../../../src/types/aiAgents.js";
import type { ChatMessage, OpenAiRole } from "../../../../src/types/chat.js";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { BaseController } from "locals/controllers/_BaseController";
import { FunctionController } from "locals/controllers/FunctionController";
import { getAgentProvider } from "locals/providers/agents/AgentProviderRegistry";
import { IAgentProvider } from "locals/interfaces/IAgentProvider";
import { IConversation } from "locals/services/ConversationsService";
import { EMAIL_AGENT_JSON_SCHEMA } from "@/SYSTEM_JSON_SCHEMAS/EMAIL_AGENT_JSON_SCHEMA";
import Logger from "locals/utils/Logger";

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

const VALID_ROLES = ["user", "assistant", "function", "system", "email_agent"];

interface SendMessageArgs {
  conversationId: string;
  agentId: string;
}

interface AgentControllerFactoryArgs {
  context: PublicContext | AuthenticatedContext;
  functionController: FunctionController;
  agentId: string;
  sessionContext: unknown;
}

class AgentController extends BaseController {
  private agent: IAiAgent;
  private agentAdapter: IAgentProvider;

  constructor(
    public context: PublicContext | AuthenticatedContext,
    public functionController: FunctionController,
    agent: IAiAgent,
    agentAdapter: IAgentProvider,
    public sessionContext: unknown // TODO: Type this
  ) {
    super();
    this.agent = agent;
    this.agentAdapter = agentAdapter;
    this.sessionContext = sessionContext;
    this.logger = new Logger({ name: "AgentController" });
  }

  static async create({
    context,
    functionController,
    agentId,
    sessionContext,
  }: AgentControllerFactoryArgs) {
    const agent = await context.agentsService.getById(agentId);

    if (!agent) {
      throw new Error(`Agent not found with ID ${agentId}`);
    }

    const adapterFactory = getAgentProvider(agent.provider, functionController);
    const agentAdapter = adapterFactory(agent);

    return new AgentController(
      context,
      functionController,
      agent,
      agentAdapter,
      sessionContext
    );
  }

  async talkToAgent(conversation_id: string) {
    const result = await this.getRequestArgs(conversation_id);

    return this.agentAdapter.talkToAgent(result, (functionCall) =>
      this.functionController.executeFunction(functionCall)
    );
  }

  getAgent() {
    return this.agent;
  }

  async getCurrentAgent(agentId: string): Promise<IAiAgent | undefined> {
    const agents = await this.context.agentsService.getAgents();

    const agent = agents.find((agent: IAiAgent) => agent.id === agentId);

    return agent;
  }

  async getAgentFunctions(agentId: string) {
    const data = await this.context.agentFunctionsService.getAgentFunctions(
      agentId
    );

    // Extract function IDs
    const functionIds = data.map((item: IAiAgentFunction) => item.function_id);

    return functionIds;
  }

  async buildAgentPrompt(agentId: string, context: IContext) {
    const { functions, session } = context;
    const { prompt, human_name, name } = this.agent;

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

  async getLastNMessages(conversation_id: string, n: number) {
    // TODO: Add search, metadata_search, role, include_deleted
    const data = await this.context.messagesService.getConversationMessages({
      conversation_id,
      // search,
      // metadata_search,
      // role,
      limit: n,
      offset: 0,
      order: "created_at",
      sort_direction: "desc",

      // include_deleted,
    });

    return data.reverse().map((message: ChatMessage) => ({
      role: message.role as OpenAiRole,
      content: message.content,
    }));
  }

  async getRequestArgs(conversationId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.agent;

    // Get function IDs associated with this agent
    const agentFunctionIds = await this.getAgentFunctions(this.agent.id);

    // Get all available functions
    const allFunctions = await this.functionController.getFunctions();

    // Filter functions to only include those associated with this agent
    // If no specific functions are associated, use all functions
    const functions =
      agentFunctionIds.length > 0
        ? allFunctions.filter((fn: IFunction) =>
            agentFunctionIds.includes(fn.name)
          )
        : allFunctions;

    const agentPrompt = await this.buildAgentPrompt(this.agent.id, {
      functions,
      session: "",
    });

    const LAST_N = 5; // TODO: make this dynamic

    const messages = [
      ...(agentPrompt ? [{ role: "system", content: agentPrompt }] : []),
      ...(await this.getLastNMessages(conversationId, LAST_N)),
    ];

    return {
      messages,
      model,
      functions,
    };
  }

  async createEmailMessage(email: string) {
    this.logger.info("Creating email message", {
      agentId: this.agent.id,
    });

    const agentConversations =
      await this.context.conversationsService.getAgentConversations(
        this.agent.id
      );

    this.logger.info("Sending to chatGPT");

    const response = await this.agentAdapter.createEmailMessage(
      email,
      EMAIL_AGENT_JSON_SCHEMA as unknown as JSON
    );
    this.logger.info("Received response from chatGPT");

    this.logger.info("Getting messages");

    const messages = await this.context.messagesService.get({
      filter: {
        "metadata->>email_id": {
          eq: response.email_id,
        },
      },
    });

    const message = messages?.[0];

    if (message) {
      this.logger.info("Message found, updating message");
      return await this.context.messagesService.update(message.id, message);
    } else {
      this.logger.info("No message found, creating new message");
      const conversation_ids = agentConversations.map(
        (conversation: IConversation) => conversation.id
      );

      const newMessage = {
        content: response,
        role: "email_agent",
        tenant_id: this.agent.tenant_id,
        user_id: this.agent.id,
        metadata: {},
      };

      return this.context.messagesService.createMessageForConversations(
        conversation_ids,
        newMessage
      );
    }
  }
}

export { AgentController };
