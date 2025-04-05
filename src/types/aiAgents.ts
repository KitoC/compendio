export interface IAiAgent {
  id: string;
  name: string;
  human_name: string;
  responsibility: string;
  enabled?: boolean;
  prompt?: string;
  provider: string;
  model?: string;
  type?: string;
  avatar_url?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  conversations?: IAiAgentConversation[];
}

export interface IAiAgentConversation {
  id: string;
  name: string;
  alias: string;
}

export interface IFunction {
  id: string;
  name: string;
  parameters?: object;
  description: string;
  markup?: object;
  type: string;
  config?: object;
  schema?: object;
}

export interface IAiAgentFunction {
  id: string;
  agent_id: string;
  function_id: string;
  created_at: string;
  updated_at: string;
}

export interface IOpenAiFunction {
  name: string;
  description: string;
  parameters: object;
  metadata?: {
    is_background_task?: boolean;
  };
}

export interface IFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
  manual?: boolean;
}

export interface IContext {
  functions: Partial<IFunction>[];
  session: string;
}
