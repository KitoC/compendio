import { useMemo, useState, useEffect, useCallback } from "react";
import { WorkflowEditorContext } from "./WorkflowEditorContext";
import Loader from "@/components/ui/loader";
import { useWorkflowQuery, useUpdateWorkflow } from "@/hooks/useWorkflowsQuery";
import { useParams } from "react-router-dom";
import { Workflow } from "@/types/workflows";

export const WorkflowEditorProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentlyOpenModal, setCurrentlyOpenModal] = useState<string | null>(
    null
  );

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useWorkflowQuery(id);

  const updateWorkflowMutation = useUpdateWorkflow(id);

  const updateWorkflow = useCallback((workflow: Workflow) => {
    setWorkflow(workflow);
  }, []);

  const saveWorkflow = useCallback(() => {
    updateWorkflowMutation.mutate(workflow);
  }, [updateWorkflowMutation, workflow]);

  useEffect(() => {
    if (data) {
      setWorkflow(data);
    }
  }, [data]);

  const isChanged = useMemo(() => {
    return JSON.stringify(workflow) !== JSON.stringify(data);
  }, [workflow, data]);

  const value = useMemo(
    () => ({
      workflow,
      isLoading,

      updateWorkflow,
      saveWorkflow,
      isSaving: updateWorkflowMutation.isPending,
      isChanged,
      setCurrentlyOpenModal,
      currentlyOpenModal,
    }),
    [
      workflow,
      isLoading,
      updateWorkflow,
      saveWorkflow,
      updateWorkflowMutation.isPending,
      isChanged,
      setCurrentlyOpenModal,
      currentlyOpenModal,
    ]
  );

  return (
    <WorkflowEditorContext.Provider value={value}>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader size="large" />
        </div>
      ) : (
        children
      )}
    </WorkflowEditorContext.Provider>
  );
};
