import { createContext, useContext } from "react";
import { Workflow, WorkflowAction } from "@/types/workflows";

interface ActionModalContextType {
  action: WorkflowAction | null;
  workflow: Workflow | null;
}

const ActionModalContext = createContext<ActionModalContextType>({
  action: null,
  workflow: null,
});

export const useActionModalContext = () => {
  return useContext(ActionModalContext);
};

export default ActionModalContext;
