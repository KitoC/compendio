import { AgentsService } from "locals/services/AgentsService";
import { ConnectedServicesService } from "locals/services/ConnectedServicesService";
import { CredentialsService } from "locals/services/CredentialsService";
import { AgentFunctionsService } from "locals/services/AgentFunctionsService";
import { MessagesService } from "locals/services/MessagesService";
import { ConversationsService } from "locals/services/ConversationsService";
import { BaseRequiredContext } from "locals/services/_BaseSupabaseService";
import { WebhookEventService } from "locals/services/WebhookEventService";
export interface SharedServices {
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
  agentsService: AgentsService;
  agentFunctionsService: AgentFunctionsService;
  messagesService: MessagesService;
  conversationsService: ConversationsService;
  webhookEventService: WebhookEventService;
}

const getSharedServices = (
  req: Request,
  supabaseContext: BaseRequiredContext
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

  return {
    credentialsService,
    connectedServicesService,
    agentsService,
    agentFunctionsService,
    messagesService,
    conversationsService,
    webhookEventService,
  };
};

export { getSharedServices };
