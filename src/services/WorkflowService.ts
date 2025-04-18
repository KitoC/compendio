import { SupabaseFunctionService } from "./supabaseFunctionServices";
import { supabase } from "@/integrations/supabase/client";

export const WorkflowService = {
  async getWorkflows() {
    const { data, error } = await supabase.from("workflows").select("*");

    if (error) {
      throw new Error("Failed to fetch workflows");
    }

    return data;
  },

  async getWorkflow(workflowId: string) {
    const response = await SupabaseFunctionService.get(
      `workflows?id=${workflowId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch records");
    }

    return response.json();
  },

  async createWorkflow(workflow: Record<string, unknown>) {
    const response = await SupabaseFunctionService.post(`workflows`, workflow);

    if (!response.ok) {
      throw new Error("Failed to create record");
    }

    return response.json();
  },

  async updateWorkflow(workflowId: string, workflow: Record<string, unknown>) {
    const response = await SupabaseFunctionService.patch(
      `workflows?id=${workflowId}`,
      workflow
    );

    if (!response.ok) {
      throw new Error("Failed to update record");
    }

    return response.json();
  },

  async deleteWorkflow(workflowId: string) {
    const response = await SupabaseFunctionService.delete(
      `workflows?id=${workflowId}`
    );

    if (!response.ok) {
      throw new Error("Failed to delete record");
    }

    return response.json();
  },
};
