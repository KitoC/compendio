import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useCustomTables } from "@/contexts/CustomTables";
import { WorkflowService } from "@/services/WorkflowService";
import { WorkflowTrigger } from "@/services/WorkflowService";
import { Workflow } from "@/types/workflows";

const QUERY_KEYS = {
  WORKFLOWS: "workflows",
  WORKFLOW_TRIGGERS: "workflow-triggers",
};

const useGetCurrentPageQueryKeyFromParams = () => {
  const params = useParams();
  const { tables } = useCustomTables();
  const table = tables.find((table) => table.name === params.id);

  if (!table) return null;

  return [QUERY_KEYS.WORKFLOWS];
};

/**
 * Hook for deleting Airtable records
 */
export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await WorkflowService.deleteWorkflow(id);
      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKFLOWS],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Workflow deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    },
  });
};

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: WorkflowService.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKFLOWS],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Workflow created successfully");
    },
    onError: (error) => {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    },
  });
};

export const useUpdateWorkflow = (id: string) => {
  const queryClient = useQueryClient();
  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: WorkflowService.updateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKFLOWS],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Workflow updated successfully");
    },
    onMutate: async (workflow) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.WORKFLOWS, id] });

      const previousWorkflow = queryClient.getQueryData([
        QUERY_KEYS.WORKFLOWS,
        id,
      ]);

      queryClient.setQueryData([QUERY_KEYS.WORKFLOWS, id], (old: Workflow) => {
        return {
          ...old,
          ...workflow,
        };
      });

      return { previousWorkflow };
    },
    onError: (error) => {
      console.error("Error updating workflow:", error);
      toast.error("Failed to update workflow");
    },
  });
};
/**
 * Hook to fetch workflows
 */
export const useWorkflowsQuery = () => {
  const { data: workflows, ...queryResults } = useQuery({
    queryKey: [QUERY_KEYS.WORKFLOWS],
    queryFn: async () => WorkflowService.getWorkflows(),
    placeholderData: [],
  });

  return {
    ...queryResults,
    workflows,
  };
};

/**
 * Hook to fetch a single workflow
 */
export const useWorkflowQuery = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKFLOWS, id],
    queryFn: async () => (await WorkflowService.getWorkflow(id))?.data,
    enabled: !!id,
  });
};
