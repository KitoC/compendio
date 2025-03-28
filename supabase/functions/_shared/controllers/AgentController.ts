// NO_CHANGE

import type {
  IAiAgent,
  IContext,
  IOpenAiFunction,
  IAiAgentFunction,
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

interface SendMessageArgs {
  newMessage: ChatMessage;
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

  talkToAgent(newMessage: ChatMessage) {
    return this.agentAdapter.talkToAgent(newMessage);
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

  async getLastNMessages(conversationId: string, n: number) {
    const { data, error } = await this.context.supabase
      .from("conversation_messages_view")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }) // or false for descending
      .range(0, n - 1);

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
    const { prompt, model = "gpt-4o-mini" } = await this.agent;

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
  }

  async createEmailMessage(email: string) {
    const agentConversations =
      await this.context.conversationsService.getAgentConversations(
        this.agent.id
      );

    const response = await this.agentAdapter.createEmailMessage(
      email,
      EMAIL_AGENT_JSON_SCHEMA as unknown as JSON
    );

    const messages = await this.context.messagesService.get({
      filter: {
        "metadata->>email_id": {
          eq: response.email_id,
        },
      },
    });

    const message = messages?.[0];

    if (message) {
      return await this.context.messagesService.update(message.id, message);
    } else {
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
