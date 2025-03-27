import { AgentsService } from "locals/services/AgentsService";
import { ConnectedServicesService } from "locals/services/ConnectedServicesService";
import { CredentialsService } from "locals/services/CredentialsService";
import { AgentFunctionsService } from "locals/services/AgentFunctionsService";
import { MessagesService } from "locals/services/MessagesService";
import { ConversationsService } from "locals/services/ConversationsService";
import { BaseRequiredContext } from "locals/services/_BaseSupabaseService";

export interface SharedServices {
  credentialsService: CredentialsService;
  connectedServicesService: ConnectedServicesService;
  agentsService: AgentsService;
  agentFunctionsService: AgentFunctionsService;
  messagesService: MessagesService;
  conversationsService: ConversationsService;
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

  return {
    credentialsService,
    connectedServicesService,
    agentsService,
    agentFunctionsService,
    messagesService,
    conversationsService,
  };
};

export { getSharedServices };
