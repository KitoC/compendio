import type { IAiAgent } from "../../../../src/types/aiAgents";
import type { ChatMessage } from "../../../../src/types/chat";
import { FunctionController } from "locals/controllers/FunctionController";

// interfaces/IAgentProvider.ts
export interface IAgentProvider {
  agent: IAiAgent;
  functionController: FunctionController;
  talkToAgent(newMessage: ChatMessage): Promise<ChatMessage>;
  createEmailMessage(email: string): Promise<JSON>;
}
