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

const useOnWorkflowTriggerSuccess = (
  queryKeys: unknown[] = [],
  action?: string
) => {
  const params = useParams();
  const queryKey = [QUERY_KEYS.WORKFLOW_TRIGGERS, params.id].filter(Boolean);

  const queryClient = useQueryClient();

  return {
    onSuccess: (message: string) => {
      queryClient.invalidateQueries({
        queryKey,
      });

      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({
          queryKey: [key],
        });
      });

      if (message) {
        toast.success(message);
      }
    },
    onMutate: async (trigger) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTriggers = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: WorkflowTrigger[]) => {
        if (action === "UPDATE") {
          return old.map((t) =>
            t.id === trigger.id ? { ...t, ...trigger } : t
          );
        }

        if (action === "DELETE") {
          return old.filter((t) => t.id !== trigger.id);
        }

        if (action === "CREATE") {
          return [...old, trigger];
        }

        return old;
      });

      return { previousTriggers };
    },
  };
};

/**
 * Hook to create a workflow trigger
 */
export const useCreateWorkflowTrigger = (queryKeys: unknown[] = []) => {
  const { onSuccess, onMutate } = useOnWorkflowTriggerSuccess(
    queryKeys,
    "CREATE"
  );

  return useMutation({
    mutationFn: WorkflowService.createWorkflowTrigger,
    onSettled: () => {
      onSuccess("Workflow trigger created successfully");
    },
    onError: (error) => {
      console.error("Error creating workflow trigger:", error);
      toast.error("Failed to create workflow trigger");
    },
    onMutate,
  });
};

/**
 * Hook to update a workflow trigger
 */
export const useUpdateWorkflowTrigger = (queryKeys: unknown[] = []) => {
  const { onSuccess, onMutate } = useOnWorkflowTriggerSuccess(
    queryKeys,
    "UPDATE"
  );

  return useMutation({
    mutationFn: WorkflowService.updateWorkflowTrigger,
    onSettled: () => {
      onSuccess("Workflow trigger updated successfully");
    },
    onError: (error) => {
      console.error("Error updating workflow trigger:", error);
      toast.error("Failed to update workflow trigger");
    },
    onMutate,
  });
};

/**
 * Hook to delete a workflow trigger
 */
export const useDeleteWorkflowTrigger = (queryKeys: unknown[] = []) => {
  const { onSuccess, onMutate } = useOnWorkflowTriggerSuccess(
    queryKeys,
    "DELETE"
  );

  return useMutation({
    mutationFn: WorkflowService.deleteWorkflowTrigger,
    onSettled: () => {
      onSuccess("Workflow trigger deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting workflow trigger:", error);
      toast.error("Failed to delete workflow trigger");
    },
    onMutate,
  });
};

/**
 * Hook to fetch workflow triggers
 */
export const useWorkflowTriggersQuery = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKFLOW_TRIGGERS, id],
    queryFn: async () => await WorkflowService.getWorkflowTriggers(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch a single workflow trigger
 */
export const useWorkflowTriggerQuery = (id: string) => {
  const queryKey = [QUERY_KEYS.WORKFLOW_TRIGGERS, id];
  const query = useQuery({
    queryKey,
    queryFn: async () => await WorkflowService.getWorkflowTrigger(id),
    enabled: !!id,
  });

  const updateTrigger = useUpdateWorkflowTrigger(queryKey);

  return {
    ...query,
    updateTrigger: updateTrigger.mutateAsync,
  };
};
