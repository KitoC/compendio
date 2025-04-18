import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import DataTable, { Column } from "@/components/data-table";
import { Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import {
  useWorkflowsQuery,
  useDeleteWorkflow,
} from "@/hooks/useWorkflowsQuery";
import { GridAction } from "@/components/DataGrid";

interface Workflow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  created_by: string;
  total_steps?: number;
}

const WorkflowsSettings = () => {
  const { urlTenantAlias } = useTenant();
  const navigate = useNavigate();

  const { workflows, isLoading } = useWorkflowsQuery();

  const deleteWorkflow = useDeleteWorkflow();

  const columns: Column<Workflow>[] = useMemo(
    () => [
      {
        field: "name",
        header: "Name",
        sortable: true,
      },
      {
        field: "description",
        header: "Description",
        sortable: true,
      },

      {
        field: "created_at",
        header: "Created",
        sortable: true,
        render: (workflow) => {
          return new Date(workflow.created_at).toLocaleDateString();
        },
      },
    ],
    []
  );

  const handleRowClick = useCallback(
    (workflow: Workflow) => {
      navigate(
        `${ROUTES.SETTINGS.replace(":tenantId", urlTenantAlias)}/workflows/${
          workflow.id
        }`
      );
    },
    [navigate, urlTenantAlias]
  );

  const actions: GridAction[] = useMemo(
    () => [
      {
        label: "Edit",
        onClick: handleRowClick,
        hidden: false,
        Icon: Pencil,
      },
      {
        label: "Delete",
        onConfirm: async (workflow: Workflow) =>
          deleteWorkflow.mutateAsync(workflow.id),
        hidden: false,
        Icon: Trash2,
      },
    ],
    [handleRowClick, deleteWorkflow]
  );

  return (
    <DataTable
      data={workflows}
      columns={columns}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      actions={actions}
    />
  );
};

export default WorkflowsSettings;
