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
  connections: { [key: string]: WorkflowConnection[] };
  settings: Record<string, unknown>;
  staticData: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  action_type: string;
  metadata: Record<string, unknown>;
  position: string;
  tenant_id: string;
  workflow_id: string;
}

interface InternalWorkflowConnection {
  source: string;
  target: string;
}

export interface WorkflowPayload {
  id?: string;
  name: string;
  description: string;
  user_id: string;
  tenant_id: string;
  externalWorkflow?: ExternalWorkflow;
  actions?: WorkflowAction[];
  triggers?: WorkflowTriggerUpdate[];
  connections?: InternalWorkflowConnection[];
  metadata?: {
    connections?: InternalWorkflowConnection[];
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  user_id: string;
  tenant_id: string;
  externalWorkflow?: ExternalWorkflow;
  actions?: WorkflowAction[];
  triggers?: WorkflowTrigger[];
  metadata?: {
    connections?: InternalWorkflowConnection[];
  };
}

export type WorkflowTrigger =
  Database["public"]["Tables"]["workflow_triggers"]["Row"];
export type WorkflowTriggerUpdate =
  Database["public"]["Tables"]["workflow_triggers"]["Update"];

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
