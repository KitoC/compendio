// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { MessagesService } from "@/services/MessagesService";
import { FunctionQueueService } from "@/services/FunctionQueueService";
import { ConnectedServicesService } from "@/services/ConnectedServicesService";
import { AzureService } from "@/services/providers/AzureService";
import { CredentialsService } from "@/services/CredentialsService";
import { AgentsService } from "@/services/AgentsService";
import { AgentFunctionsService } from "@/services/AgentFunctionsService";
import { ConversationsService } from "@/services/ConversationsService";
import { WebhookEventService } from "@/services/WebhookEventService";
import { CorsContext } from "@/middleware/withCors";
import { OnboardingSessionsService } from "@/services/OnboardingSessionsService";
import { DataTablesService } from "@/services/DataTablesService";
import { FunctionsService } from "@/services/FunctionsService";
import { GmailService } from "@/services/providers/GmailService";
import { WorkflowsService } from "@/services/WorkflowsService";
import { OpenAiService } from "@/services/providers/OpenAiService";
interface SupabaseContext {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
}

export interface WSSContext {
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
  agentsService: AgentsService;
  agentFunctionsService: AgentFunctionsService;
  messagesService: MessagesService;
  conversationsService: ConversationsService;
  webhookEventService: WebhookEventService;
  functionQueueService: FunctionQueueService;
  azureService: AzureService;
  onboardingSessionsService: OnboardingSessionsService;
  dataTablesService: DataTablesService;
  functionsService: FunctionsService;
  gmailService: GmailService;
  workflowsService: WorkflowsService;
  openAiService: OpenAiService;
}

export interface SharedServices extends CorsContext {
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
  agentsService: AgentsService;
  agentFunctionsService: AgentFunctionsService;
  messagesService: MessagesService;
  conversationsService: ConversationsService;
  webhookEventService: WebhookEventService;
  functionQueueService: FunctionQueueService;
  azureService: AzureService;
  onboardingSessionsService: OnboardingSessionsService;
  dataTablesService: DataTablesService;
  functionsService: FunctionsService;
  gmailService: GmailService;
  workflowsService: WorkflowsService;
  openAiService: OpenAiService;
}

export const getSharedServices = (supabaseContext: SupabaseContext) => {
  const credentialsService = new CredentialsService(supabaseContext);
  const connectedServicesService = new ConnectedServicesService(
    supabaseContext
  );
  const agentsService = new AgentsService(supabaseContext);
  const agentFunctionsService = new AgentFunctionsService(supabaseContext);
  const messagesService = new MessagesService(supabaseContext);
  const conversationsService = new ConversationsService(supabaseContext);
  const webhookEventService = new WebhookEventService(supabaseContext);
  const functionQueueService = new FunctionQueueService(supabaseContext);
  const azureService = new AzureService();
  const onboardingSessionsService = new OnboardingSessionsService(
    supabaseContext
  );
  const dataTablesService = new DataTablesService(supabaseContext);
  const functionsService = new FunctionsService(supabaseContext);
  const gmailService = new GmailService();
  const workflowsService = new WorkflowsService(supabaseContext);
  const openAiService = new OpenAiService();
  return {
    credentialsService,
    connectedServicesService,
    agentsService,
    agentFunctionsService,
    messagesService,
    conversationsService,
    webhookEventService,
    functionQueueService,
    azureService,
    onboardingSessionsService,
    dataTablesService,
    functionsService,
    gmailService,
    workflowsService,
    openAiService,
  };
};
