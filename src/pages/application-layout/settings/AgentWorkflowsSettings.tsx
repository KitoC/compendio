
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import DataTable, { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IAiAgent } from "@/types/aiAgents";

interface Workflow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  total_steps?: number;
}

interface AgentWorkflow {
  id: string;
  agent_id: string;
  workflow_id: string;
  created_at: string;
  workflow?: Workflow;
}

const AgentWorkflowsSettings = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<IAiAgent | null>(null);
  const [agentWorkflows, setAgentWorkflows] = useState<AgentWorkflow[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");

  useEffect(() => {
    if (id && tenantId) {
      fetchAgent();
      fetchAgentWorkflows();
      fetchAvailableWorkflows();
    }
  }, [id, tenantId]);

  const fetchAgent = async () => {
    if (!tenantId || !id) return;

    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      setAgent(data);
    } catch (error) {
      console.error("Error fetching agent:", error);
      toast.error("Failed to load agent details");
      navigate(ROUTES.SETTINGS_AGENTS);
    }
  };

  const fetchAgentWorkflows = async () => {
    if (!tenantId || !id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ai_agent_workflows")
        .select(`
          *,
          workflow:workflow_id (
            id,
            name,
            description,
            created_at,
            workflow_steps (count)
          )
        `)
        .eq("agent_id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      
      // Transform data to include workflow details
      const transformedData = (data || []).map(item => ({
        ...item,
        workflow: {
          ...item.workflow,
          total_steps: item.workflow.workflow_steps[0]?.count || 0
        }
      }));
      
      setAgentWorkflows(transformedData);
    } catch (error) {
      console.error("Error fetching agent workflows:", error);
      toast.error("Failed to load agent workflows");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableWorkflows = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, name, description, created_at")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setAvailableWorkflows(data || []);
    } catch (error) {
      console.error("Error fetching available workflows:", error);
    }
  };

  const handleAddWorkflow = async () => {
    if (!tenantId || !id || !selectedWorkflowId) return;

    try {
      // Check if already linked
      const isAlreadyLinked = agentWorkflows.some(
        (aw) => aw.workflow_id === selectedWorkflowId
      );

      if (isAlreadyLinked) {
        toast.error("This workflow is already linked to the agent");
        return;
      }

      const { error } = await supabase.from("ai_agent_workflows").insert([
        {
          agent_id: id,
          workflow_id: selectedWorkflowId,
          tenant_id: tenantId,
        },
      ]);

      if (error) throw error;
      toast.success("Workflow linked successfully");
      fetchAgentWorkflows();
      setShowAddDialog(false);
      setSelectedWorkflowId("");
    } catch (error) {
      console.error("Error linking workflow:", error);
      toast.error("Failed to link workflow");
    }
  };

  const handleRemoveWorkflow = async (linkId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from("ai_agent_workflows")
        .delete()
        .eq("id", linkId)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      toast.success("Workflow unlinked successfully");
      fetchAgentWorkflows();
    } catch (error) {
      console.error("Error unlinking workflow:", error);
      toast.error("Failed to unlink workflow");
    }
  };

  const columns: Column<AgentWorkflow>[] = [
    {
      field: "workflow.name",
      header: "Workflow Name",
      sortable: true,
      render: (item) => item.workflow?.name || "Unknown",
    },
    {
      field: "workflow.description",
      header: "Description",
      sortable: true,
      render: (item) => item.workflow?.description || "",
    },
    {
      field: "workflow.total_steps",
      header: "Steps",
      sortable: true,
      render: (item) => item.workflow?.total_steps || 0,
    },
    {
      field: "created_at",
      header: "Linked On",
      sortable: true,
      render: (item) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  if (!agent) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTES.SETTINGS_AGENTS)}
        >
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold">
          Agent Workflows: {agent.human_name || agent.name}
        </h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Linked Workflows</CardTitle>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Link Workflow
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={agentWorkflows}
            columns={columns}
            permissions={{
              create: false,
              read: true,
              update: false,
              delete: true,
              export: false,
            }}
            onRowClick={(item) => navigate(`${ROUTES.SETTINGS}/workflows/${item.workflow_id}`)}
            onDelete={(id) => handleRemoveWorkflow(id as string)}
            isLoading={isLoading}
            searchable={true}
            pagination={true}
            pageSize={10}
            emptyMessage="No workflows linked to this agent. Link a workflow to get started."
          />
        </CardContent>
      </Card>

      {/* Add Workflow Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Workflow to Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Workflow</label>
              <Select
                value={selectedWorkflowId}
                onValueChange={setSelectedWorkflowId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a workflow" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkflows
                    .filter(
                      (w) =>
                        !agentWorkflows.some(
                          (aw) => aw.workflow_id === w.id
                        )
                    )
                    .map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedWorkflowId && (
              <div className="p-4 bg-muted/50 rounded-md">
                <h4 className="text-sm font-medium mb-1">Workflow Details</h4>
                <p className="text-sm">
                  {availableWorkflows.find(w => w.id === selectedWorkflowId)?.description || "No description"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddWorkflow}
              disabled={!selectedWorkflowId}
            >
              Link Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentWorkflowsSettings;
