import type { IAiAgent } from "../../../../src/types/aiAgents";
import type { ChatMessage } from "../../../../src/types/chat";
import {
  ExecuteFunctionCallback,
  FunctionController,
} from "locals/controllers/FunctionController";
import type { NormalizedEmailResponse } from "../../../../src/types/emailAgentMessage";
import type { IFunction } from "../../../../src/types/aiAgents";

export interface ItTalkToAgentParams {
  messages: ChatMessage[];
  model: string;
  functions: IFunction[];
}

// interfaces/IAgentProvider.ts
export interface IAgentProvider {
  agent: IAiAgent;
  functionController: FunctionController;
  talkToAgent(
    talkToAgentParams: ItTalkToAgentParams,
    onFunctionCall: ExecuteFunctionCallback
  ): Promise<ReadableStream<Uint8Array>>;
  createEmailMessage(
    email: string,
    jsonSchema: JSON
  ): Promise<NormalizedEmailResponse>;
}
