import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useCustomTables } from "@/contexts/CustomTables";
import { WorkflowService } from "@/services/WorkflowService";

const QUERY_KEYS = {
  WORKFLOWS: "workflows",
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
