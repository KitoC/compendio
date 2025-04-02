import type { IAiAgent } from "@/types/aiAgents";
import type { ChatMessage } from "@/types/chat";
import {
  ExecuteFunctionCallback,
  FunctionController,
} from "locals/controllers/FunctionController";
import type { NormalizedEmailResponse } from "@/types/emailAgentMessage";
import type { IFunction } from "@/types/aiAgents";

export interface AgentMessage {
  role: string;
  content: string;
}

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
  sendMessages(
    messages: AgentMessage[],
    options?: object
  ): Promise<string | object>;
  normalizeMessage(message: ChatMessage): AgentMessage;
  normalizeMessages(messages: ChatMessage[]): AgentMessage[];
}
