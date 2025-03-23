import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import DataTable, { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
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
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns: Column<Workflow>[] = [
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
      field: "total_steps",
      header: "Steps",
      sortable: true,
      render: (workflow) => {
        return workflow.total_steps ? workflow.total_steps : "0";
      },
    },
    {
      field: "created_at",
      header: "Created",
      sortable: true,
      render: (workflow) => {
        return new Date(workflow.created_at).toLocaleDateString();
      },
    },
  ];

  const fetchWorkflows = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);

      // Fetch workflows with count of steps
      const { data, error } = await supabase
        .from("workflows")
        .select(
          `
          *,
          workflow_steps (count)
        `
        )
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Transform data to include step count
      const workflowsWithStepCount =
        data?.map((workflow) => ({
          ...workflow,
          total_steps: workflow.workflow_steps[0]?.count || 0,
        })) || [];

      setWorkflows(workflowsWithStepCount);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [tenantId]);

  const handleCreateWorkflow = async (workflow: Partial<Workflow>) => {
    if (!tenantId || !user) return;

    const workflowData = {
      ...workflow,
      created_by: user.id,
      tenant_id: tenantId,
    } as Workflow;

    const { data, error } = await supabase
      .from("workflows")
      .insert([workflowData])
      .select();

    if (error) throw error;

    toast.success("Workflow created successfully");
    fetchWorkflows();

    // Navigate to workflow detail page
    if (data && data[0]) {
      navigate(`${ROUTES.SETTINGS}/workflows/${data[0].id}`);
    }
  };

  const handleUpdateWorkflow = async (workflow: Workflow) => {
    if (!tenantId) return;

    const { error } = await supabase
      .from("workflows")
      .update(workflow)
      .eq("id", workflow.id)
      .eq("tenant_id", tenantId);

    if (error) throw error;

    toast.success("Workflow updated successfully");
    fetchWorkflows();
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!tenantId) return;

    try {
      // Delete workflow steps first (cascade delete not set up)
      await supabase
        .from("workflow_steps")
        .delete()
        .eq("workflow_id", id)
        .eq("tenant_id", tenantId);

      // Delete workflow
      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Workflow deleted successfully");
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  const handleRowClick = (workflow: Workflow) => {
    navigate(`${ROUTES.SETTINGS}/workflows/${workflow.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <Button onClick={() => navigate(`${ROUTES.SETTINGS}/workflows/new`)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <DataTable
        data={workflows}
        columns={columns}
        onRowClick={handleRowClick}
        getFormConfig={(formConfig) => {
          return {
            ...formConfig,
            title: "Workflow",
            description: "Create or edit a workflow",
          };
        }}
        permissions={{
          create: true,
          read: true,
          update: true,
          delete: true,
          export: false,
        }}
        onUpdate={handleUpdateWorkflow}
        onCreate={handleCreateWorkflow}
        onDelete={handleDeleteWorkflow}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default WorkflowsSettings;
