// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import { MessagesService } from "locals/services/MessagesService";
import { FunctionQueueService } from "locals/services/FunctionQueueService";
import { ConnectedServicesService } from "locals/services/ConnectedServicesService";
import { AzureService } from "locals/services/providers/AzureService";
import { CredentialsService } from "locals/services/CredentialsService";
import { AgentsService } from "locals/services/AgentsService";
import { AgentFunctionsService } from "locals/services/AgentFunctionsService";
import { ConversationsService } from "locals/services/ConversationsService";
import { WebhookEventService } from "locals/services/WebhookEventService";
import { CorsContext } from "locals/middleware/withCors";
import { OnboardingSessionsService } from "locals/services/OnboardingSessionsService";
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
  };
};
