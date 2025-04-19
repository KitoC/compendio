import { Workflow } from "@/types/workflows";
import { Database } from "@/integrations/supabase/types";
import { SupabaseFunctionService } from "./supabaseFunctionServices";
import { supabase } from "@/integrations/supabase/client";

export type WorkflowTrigger =
  Database["public"]["Tables"]["workflow_triggers"]["Row"];
export type WorkflowTriggerCreate =
  Database["public"]["Tables"]["workflow_triggers"]["Insert"];
export type WorkflowTriggerUpdate =
  Database["public"]["Tables"]["workflow_triggers"]["Update"];

const WORKFLOWS_TABLE_NAME = "workflows";
const WORKFLOW_TRIGGERS_TABLE_NAME = "workflow_triggers";

export const WorkflowService = {
  async getWorkflows() {
    const { data, error } = await supabase
      .from(WORKFLOWS_TABLE_NAME)
      .select("*");

    if (error) {
      throw new Error("Failed to fetch workflows");
    }

    return data;
  },

  async getWorkflow(workflowId: string): Promise<{ data: Workflow }> {
    const response = await SupabaseFunctionService.get(
      `${WORKFLOWS_TABLE_NAME}?id=${workflowId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch records");
    }

    return response.json();
  },

  async createWorkflow(workflow: Record<string, unknown>) {
    const response = await SupabaseFunctionService.post(
      `${WORKFLOWS_TABLE_NAME}`,
      workflow
    );

    if (!response.ok) {
      throw new Error("Failed to create record");
    }

    return response.json();
  },

  async updateWorkflow(workflowId: string, workflow: Record<string, unknown>) {
    const response = await SupabaseFunctionService.patch(
      `${WORKFLOWS_TABLE_NAME}?id=${workflowId}`,
      workflow
    );

    if (!response.ok) {
      throw new Error("Failed to update record");
    }

    return response.json();
  },

  async deleteWorkflow(workflowId: string) {
    const response = await SupabaseFunctionService.delete(
      `${WORKFLOWS_TABLE_NAME}?id=${workflowId}`
    );

    if (!response.ok) {
      throw new Error("Failed to delete record");
    }

    return response.json();
  },

  async getWorkflowTriggers(workflowId: string) {
    const { data, error } = await supabase
      .from(WORKFLOW_TRIGGERS_TABLE_NAME)
      .select("*")
      .eq("workflow_id", workflowId);

    if (error) {
      throw new Error("Failed to fetch workflow triggers");
    }

    return data;
  },

  async getWorkflowTrigger(triggerId: string) {
    const { data, error } = await supabase
      .from(WORKFLOW_TRIGGERS_TABLE_NAME)
      .select("*")
      .eq("id", triggerId)
      .single();

    if (error) {
      throw new Error("Failed to fetch workflow trigger");
    }

    return data;
  },

  async createWorkflowTrigger(trigger: WorkflowTriggerCreate) {
    const { data, error } = await supabase
      .from(WORKFLOW_TRIGGERS_TABLE_NAME)
      .insert(trigger);

    if (error) {
      throw new Error("Failed to create workflow trigger");
    }

    return data;
  },

  async updateWorkflowTrigger(trigger: WorkflowTriggerUpdate) {
    if (!trigger.id) {
      throw new Error("Trigger ID is required");
    }

    const { data, error } = await supabase
      .from(WORKFLOW_TRIGGERS_TABLE_NAME)
      .update(trigger)
      .eq("id", trigger.id);

    if (error) {
      throw new Error("Failed to update workflow trigger");
    }

    return data;
  },

  async deleteWorkflowTrigger(triggerId: string) {
    const { data, error } = await supabase
      .from(WORKFLOW_TRIGGERS_TABLE_NAME)
      .delete()
      .eq("id", triggerId);

    if (error) {
      throw new Error("Failed to delete workflow trigger");
    }

    return data;
  },
};
