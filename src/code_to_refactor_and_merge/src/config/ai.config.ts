
export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  streamResponse?: boolean;
  tools?: any[];
}

export const defaultAIConfig: AIConfig = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  streamResponse: true,
  tools: []
};
