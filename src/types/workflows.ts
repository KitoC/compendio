import { Database } from "@/integrations/supabase/types";

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  webhookId: string;
  disabled: boolean;
  notesInFlow: boolean;
  notes: string;
  typeVersion: number;
  executeOnce: boolean;
  alwaysOutputData: boolean;
  retryOnFail: boolean;
  maxTries: number;
  waitBetweenTries: number;
  continueOnFail: boolean;
  onError: string;
}

export interface WorkflowConnection {
  node: string;
  type: string;
  index: number;
}

export interface ExternalWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: { main: WorkflowConnection[] };
  settings: Record<string, unknown>;
  staticData: Record<string, unknown>;
}
export interface WorkflowPayload {
  id?: string;
  name: string;
  description: string;
  user_id: string;
  tenant_id: string;
  externalWorkflow?: ExternalWorkflow;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  user_id: string;
  tenant_id: string;
  externalWorkflow?: ExternalWorkflow;
}

export type WorkflowTrigger =
  Database["public"]["Tables"]["workflow_triggers"]["Row"];

export interface WorkspaceTag {
  id: string;
  name: string;
}

export interface CallN8NApiParams {
  path: string;
  method: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  options?: {
    noJson?: boolean;
  };
}
