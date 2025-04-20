import { useContext } from "react";
import { WorkflowEditorContext } from "./WorkflowEditorContext";

export const useWorkflowEditor = () => {
  const context = useContext(WorkflowEditorContext);
  if (!context) {
    throw new Error(
      "useWorkflowEditor must be used within a WorkflowEditorProvider"
    );
  }
  return context;
};
