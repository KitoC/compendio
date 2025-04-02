export interface IAiAgent {
  id: string;
  name: string;
  human_name: string;
  responsibility: string;
  enabled?: boolean;
  prompt?: string;
  model?: string;
  type?: string;
  avatar_url?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
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
}

export interface IFunctionCall {
  name: string;
  arguments: string;
  manual?: boolean;
}

export interface IContext {
  functions: Partial<IFunction>[];
  session: string;
}
