import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import DataTable, { Column } from "@/components/data-table";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import {
  useWorkflowsQuery,
  useDeleteWorkflow,
  useCreateWorkflow,
} from "@/hooks/useWorkflowsQuery";
import { GridAction } from "@/components/DataGrid";
import { Button } from "@/components/ui/button";
import { buildPathWithParams } from "@/utils/urlHelpers";

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
  const [isCreating, setIsCreating] = useState(false);

  const { workflows, isLoading } = useWorkflowsQuery();

  const deleteWorkflow = useDeleteWorkflow();

  const createWorkflow = useCreateWorkflow();

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

  const onCreateWorkflow = useCallback(async () => {
    setIsCreating(true);
    const { id } = await createWorkflow.mutateAsync({
      name: `My workflow ${workflows.length + 1}`,
      description: "",
      externalWorkflow: {
        nodes: [
          {
            parameters: {
              workflowInputs: {
                values: [
                  { name: "tenant_id" },
                  { name: "payload", type: "object" },
                  { name: "base_url" },
                ],
              },
            },
            type: "n8n-nodes-base.executeWorkflowTrigger",
            typeVersion: 1.1,
            position: [0, 0],
            name: "payload",
          },
        ],
        connections: { main: [] },
        settings: {},
      },
    });
    navigate(
      buildPathWithParams(ROUTES.SETTINGS_WORKFLOW_DETAIL, {
        tenantId: urlTenantAlias,
        id,
      })
    );
  }, [createWorkflow, workflows, navigate, urlTenantAlias]);

  return (
    <DataTable
      data={workflows}
      columns={columns}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      actions={actions}
      permissions={{
        create: false,
        read: true,
        update: true,
        delete: true,
        export: false,
      }}
      headerItems={
        <>
          <Button disabled={isCreating} onClick={onCreateWorkflow}>
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Workflow
          </Button>
        </>
      }
    />
  );
};

export default WorkflowsSettings;
