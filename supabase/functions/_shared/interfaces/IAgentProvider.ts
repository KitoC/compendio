import type { IAiAgent } from "../../../../src/types/aiAgents";
import type { ChatMessage } from "../../../../src/types/chat";
import { FunctionController } from "locals/controllers/FunctionController";
import type { NormalizedEmailResponse } from "../../../../src/types/emailAgentMessage";
// interfaces/IAgentProvider.ts
export interface IAgentProvider {
  agent: IAiAgent;
  functionController: FunctionController;
  talkToAgent(newMessage: ChatMessage): Promise<ChatMessage>;
  createEmailMessage(
    email: string,
    jsonSchema: JSON
  ): Promise<NormalizedEmailResponse>;
}
