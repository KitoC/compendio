// NO_CHANGE

import type {
  IAiAgent,
  IContext,
  IAiAgentFunction,
  IFunction,
} from "@/types/aiAgents";
import type { ChatMessage, OpenAiRole } from "@/types/chat";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { BaseController } from "locals/controllers/_BaseController";
import { FunctionController } from "locals/controllers/FunctionController";
import { getAgentProvider } from "locals/providers/agents/AgentProviderRegistry";
import { IAgentProvider } from "locals/interfaces/IAgentProvider";
import Logger from "locals/utils/Logger";
import { UpdateChatMessageParams } from "locals/services/MessagesService";
import { RECORD_FUNCTIONS } from "@/SYSTEM_FUNCTIONS/RECORD_FUNCTIONS";
import { GET_RECORDS_PROMPT } from "@/SYSTEM_PROMPTS/GET_RECORDS_PROMPT";

interface AgentControllerFactoryArgs {
  context: AuthenticatedContext;
  functionController: FunctionController;
  agentId: string;
  sessionContext: string;
}

class AgentController extends BaseController {
  public agent: IAiAgent;
  public agentAdapter: IAgentProvider;

  constructor(
    public context: AuthenticatedContext,
    public functionController: FunctionController,
    agent: IAiAgent,
    agentAdapter: IAgentProvider,
    public sessionContext: string
  ) {
    super();
    this.agent = agent;
    this.agentAdapter = agentAdapter;
    this.sessionContext = sessionContext;
    this.logger = new Logger({ name: "AgentController" });
  }

  static async create<T extends typeof AgentController>(
    this: T,
    {
      context,
      functionController,
      agentId,
      sessionContext,
    }: AgentControllerFactoryArgs
  ): Promise<InstanceType<T>> {
    const agent = await context.agentsService.getById(agentId);

    if (!agent) {
      throw new Error(`Agent not found with ID ${agentId}`);
    }

    const adapterFactory = getAgentProvider(agent.provider, functionController);
    const agentAdapter = adapterFactory(agent);

    return new this(
      context,
      functionController,
      agent,
      agentAdapter,
      sessionContext
    ) as InstanceType<T>;
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

  async getTableSchemas() {
    const base_id = this.context.airtableService.base_id;

    const tableSchemas = await this.context.dataTablesService.getTableSchemas({
      base_id,
    });

    return tableSchemas;
  }

  async buildTableSchemasPrompt() {
    const tableSchemas = await this.getTableSchemas();

    const tablesPrompt = tableSchemas
      .map((table) => {
        return `#### ${table.name}\n${table.data_fields
          .map((field) => {
            const options = field.schema?.options?.choices
              ?.map((choice) => choice.name)
              .join("|");
            const fieldType = field.schema?.type;

            return `- ${field.schema.name} type[${fieldType}] ${
              options ? `options[${options}]` : ""
            }`;
          })
          .join("\n")}`;
      })
      .join("\n");

    return tablesPrompt;
  }

  async buildAgentPrompt(agentId: string, context: IContext) {
    const { functions } = context;
    const { prompt, human_name, name } = this.agent;

    let interpolatedPrompt = prompt;

    const AVAILABLE_TABLES = await this.buildTableSchemasPrompt();

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
    ].forEach(({ variable, replacement }) => {
      interpolatedPrompt = interpolatedPrompt?.replace(variable, replacement());
    });

    const tablesPrompt = GET_RECORDS_PROMPT.replace(
      "{{AVAILABLE_TABLES}}",
      AVAILABLE_TABLES
    );

    return [
      `SESSION: ${this.sessionContext}`,
      interpolatedPrompt,
      tablesPrompt,
    ].join("\n\n");
  }

  async getLastNMessages(conversation_id: string, n: number) {
    // TODO: Add search, metadata_search, role, include_deleted
    const { messages } =
      await this.context.messagesService.getConversationMessages({
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

    return messages.reverse().map((message: ChatMessage) => ({
      role: message.role as OpenAiRole,
      content: message.content,
    }));
  }

  async getFunctions() {
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

    return [...functions, ...RECORD_FUNCTIONS];
  }

  async getRequestArgs(conversationId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.agent;

    const functions = await this.getFunctions();

    this.logger.debug("Session context --> ", this.sessionContext);

    const agentPrompt = await this.buildAgentPrompt(this.agent.id, {
      functions,
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

  async updateMessageWithSummaryMetadata(
    message: UpdateChatMessageParams,
    prompt: string
  ) {
    const summary = await this.agentAdapter.sendMessages([
      { role: "system", content: prompt },
      this.agentAdapter.normalizeMessage({
        ...message,
        role: "user",
      } as unknown as ChatMessage),
    ]);

    const updatedMessage = await this.context.messagesService.updateMessage({
      message_id: message.message_id,
      content: message.content,
      role: message.role,
      metadata: { ...message.metadata, summary },
    });

    this.logger.info("🔹 Message updated with summary metadata");

    return updatedMessage;
  }

  async triggerFunctionCall(payload: {
    function_context: unknown;
    type: string;
  }) {
    // TODO
    // Get function IDs associated with this agent
    const agentFunctionIds = await this.getAgentFunctions(this.agent.id);

    // Get all available functions
    const allFunctions = await this.functionController.getFunctions();
  }
}

export { AgentController };
