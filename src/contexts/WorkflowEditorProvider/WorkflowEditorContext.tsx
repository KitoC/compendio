import { createContext } from "react";
import { WorkflowPayload, Workflow } from "@/types/workflows";

export interface WorkflowEditorContextType {
  workflow: Workflow;
  isLoading: boolean;
  updateWorkflow: (workflow: WorkflowPayload) => void;
  saveWorkflow: () => void;
  isSaving: boolean;
  isChanged: boolean;
  setCurrentlyOpenModal: (modalId: string | null) => void;
  currentlyOpenModal: string | null;
}

export const WorkflowEditorContext = createContext<
  WorkflowEditorContextType | undefined
>(undefined);
