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

  const [currentChangeIndex, setCurrentChangeIndex] = useState<number>(0);
  const [changes, setChanges] = useState<Workflow[]>([]);
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useWorkflowQuery(id);

  const [workflow, setWorkflow] = useState<Workflow>(data);

  // const workflow = changes?.[currentChangeIndex] || data;

  const updateWorkflowMutation = useUpdateWorkflow(id);

  const updateWorkflow = useCallback((workflow: Workflow) => {
    // setChanges((prev) =>
    //   currentChangeIndex === prev.length - 1
    //     ? [...prev, workflow]
    //     : [...prev.slice(0, currentChangeIndex + 1), workflow]
    // );
    // setCurrentChangeIndex((prev) => prev + 1);
    setWorkflow(workflow);
  }, []);

  const saveWorkflow = useCallback(() => {
    updateWorkflowMutation.mutate(workflow);
  }, [updateWorkflowMutation, workflow]);

  const revertChange = useCallback(() => {
    // setCurrentChangeIndex((prev) => prev - 1);
  }, []);

  const redoChange = useCallback(() => {
    // setCurrentChangeIndex((prev) => prev + 1);
  }, []);

  const revertChanges = useCallback(() => {
    setWorkflow(data);
    setCurrentChangeIndex(currentChangeIndex - 1);
  }, [data, currentChangeIndex]);

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
      currentChangeIndex,
      changes,
      revertChange,
      redoChange,
      revertChanges,
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
      currentChangeIndex,
      changes,
      revertChange,
      redoChange,
      revertChanges,
    ]
  );

  return (
    <WorkflowEditorContext.Provider value={value} key={currentChangeIndex}>
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
