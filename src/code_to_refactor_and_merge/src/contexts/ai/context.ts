import { createContext, useContext } from "react";
import { AIConfig } from "../../config/ai.config";
import { IMessage } from "./types";

export interface SendMessageArgs {
  messages: IMessage[];
  onUpdate?: (text: string) => void;
  conversationHistory?: IMessage[];
  systemPrompt?: string;
  model?: string;
  aiConfigOverrides?: Partial<AIConfig>;
}

export type SendMessageFunc = (args: SendMessageArgs) => Promise<string>;

export interface AIContextType {
  sendMessage: SendMessageFunc;
  isLoading: boolean;
  error: Error | null;
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  isStreaming: boolean;
}

export const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
};
