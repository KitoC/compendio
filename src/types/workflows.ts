
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

// Add new action types for Conditional action
export interface WorkflowCondition {
  leftValue: { value: any } | undefined;
  operator: string | undefined;
  rightValue: { value: any } | undefined;
}

export interface WorkflowConditionalMetadata {
  use_ai: boolean;
  ai_prompt: string;
  andOrValue: string;
  conditions: WorkflowCondition[];
}

// Add types for create/update record actions
export interface WorkflowRecordFieldMapping {
  field: string;
  value: any;
  type?: string;
}

export interface WorkflowCreateOrUpdateRecordMetadata {
  use_ai: boolean;
  ai_prompt: string;
  input_data: any[];
  fields: WorkflowRecordFieldMapping[];
}

export interface AirtableChoice {
  color?: string;
  name: string;
}

export interface AirtableFieldOption {
  choices: AirtableChoice[];
  [key: string]: any;
}
