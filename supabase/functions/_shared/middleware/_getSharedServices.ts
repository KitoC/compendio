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
interface SupabaseContext {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
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
}

export const getSharedServices = (
  req: Request,
  supabaseContext: SupabaseContext
) => {
  const credentialsService = new CredentialsService(req, supabaseContext);
  const connectedServicesService = new ConnectedServicesService(
    req,
    supabaseContext
  );
  const agentsService = new AgentsService(req, supabaseContext);
  const agentFunctionsService = new AgentFunctionsService(req, supabaseContext);
  const messagesService = new MessagesService(req, supabaseContext);
  const conversationsService = new ConversationsService(req, supabaseContext);
  const webhookEventService = new WebhookEventService(req, supabaseContext);
  const functionQueueService = new FunctionQueueService(req, supabaseContext);
  const azureService = new AzureService();
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
  };
};
