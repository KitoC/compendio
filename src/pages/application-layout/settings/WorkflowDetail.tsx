import { NavLink } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import WorkflowEditor from "./WorkflowEditor";
import { buildPathWithParams } from "@/utils/urlHelpers";
import {
  useWorkflowEditor,
  WorkflowEditorProvider,
} from "@/contexts/WorkflowEditorProvider";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";

const WorkflowDetail = () => {
  const { workflow, isLoading, isChanged, isSaving, saveWorkflow } =
    useWorkflowEditor();
  const { urlTenantAlias } = useTenant();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader size="large" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Workflow not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2 flex items-center shadow-md">
        <div className="flex items-center gap-2 w-full">
          <NavLink
            to={buildPathWithParams(ROUTES.SETTINGS_WORKFLOWS, {
              tenantId: urlTenantAlias,
            })}
          >
            <ArrowLeft size={16} />
          </NavLink>

          <h2 className="text-lg font-medium">
            {workflow?.name || "Workflow Detail"}
          </h2>

          <div className="ml-auto">
            <Button
              size="xs"
              onClick={saveWorkflow}
              disabled={!isChanged || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size="small" className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save workflow
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div id="workflow-editor-container" className="flex-grow relative">
        <WorkflowEditor workflow={workflow} isLoading={isLoading} />
      </div>
    </div>
  );
};

const ProvidedWorkflowDetail = () => {
  return (
    <WorkflowEditorProvider>
      <WorkflowDetail />
    </WorkflowEditorProvider>
  );
};

export default ProvidedWorkflowDetail;
