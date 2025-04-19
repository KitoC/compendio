import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

import { ArrowLeft } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import {
  useWorkflowQuery,
  useWorkflowTriggersQuery,
} from "@/hooks/useWorkflowsQuery";
import Loader from "@/components/ui/loader";
import WorkflowEditor from "./WorkflowEditor";
import { buildPathWithParams } from "@/utils/urlHelpers";

const WorkflowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { urlTenantAlias } = useTenant();
  const navigate = useNavigate();

  const { data: workflow, isLoading, ...rest } = useWorkflowQuery(id);
  const { data: workflowTriggers, isLoading: isLoadingWorkflowTriggers } =
    useWorkflowTriggersQuery(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2 flex items-center shadow-md">
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div id="workflow-editor-container" className="flex-grow relative">
        <WorkflowEditor
          workflow={workflow}
          workflowTriggers={workflowTriggers}
          isLoading={isLoadingWorkflowTriggers || isLoading}
        />
      </div>
    </div>
  );
};

export default WorkflowDetail;
