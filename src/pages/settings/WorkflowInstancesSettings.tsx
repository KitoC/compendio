
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DataTable, { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkflowInstance {
  id: string;
  workflow_id: string;
  agent_id: string;
  status: string;
  current_step: number;
  created_at: string;
  completed_at: string | null;
  tenant_id: string;
  workflow_name?: string;
  agent_name?: string;
}

interface WorkflowResponse {
  id: string;
  workflow_instance_id: string;
  step_index: number;
  response: any;
  status: string;
  error_message: string | null;
  created_at: string;
  tenant_id: string;
}

interface Workflow {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  human_name: string;
}

const WorkflowInstancesSettings = () => {
  const { tenantId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [instanceResponses, setInstanceResponses] = useState<WorkflowResponse[]>([]);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [filterWorkflow, setFilterWorkflow] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (tenantId) {
      fetchWorkflowInstances();
      fetchWorkflows();
      fetchAgents();
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchWorkflowInstances();
    }
  }, [filterWorkflow, filterAgent, filterStatus]);

  const fetchWorkflowInstances = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      
      let query = supabase
        .from("workflow_instances")
        .select(`
          *,
          workflows:workflow_id (name),
          ai_agents:agent_id (name, human_name)
        `)
        .eq("tenant_id", tenantId);
        
      // Apply filters
      if (filterWorkflow !== "all") {
        query = query.eq("workflow_id", filterWorkflow);
      }
      
      if (filterAgent !== "all") {
        query = query.eq("agent_id", filterAgent);
      }
      
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      
      // Order by created_at
      query = query.order("created_at", { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to include workflow and agent names
      const transformedData = (data || []).map((instance) => ({
        ...instance,
        workflow_name: instance.workflows?.name || "Unknown",
        agent_name: instance.ai_agents?.human_name || instance.ai_agents?.name || "Unknown",
      }));
      
      setInstances(transformedData);
    } catch (error) {
      console.error("Error fetching workflow instances:", error);
      toast.error("Failed to load workflow instances");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, name")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const fetchAgents = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, human_name")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const fetchInstanceResponses = async (instanceId: string) => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("workflow_responses")
        .select("*")
        .eq("workflow_instance_id", instanceId)
        .eq("tenant_id", tenantId)
        .order("step_index", { ascending: true });

      if (error) throw error;
      setInstanceResponses(data || []);
    } catch (error) {
      console.error("Error fetching workflow responses:", error);
      toast.error("Failed to load workflow responses");
    }
  };

  const handleRowClick = async (instance: WorkflowInstance) => {
    setSelectedInstance(instance);
    await fetchInstanceResponses(instance.id);
    setShowResponsesDialog(true);
  };

  const handleDeleteInstance = async (id: string) => {
    if (!tenantId) return;

    try {
      // First delete any responses for this instance
      await supabase
        .from("workflow_responses")
        .delete()
        .eq("workflow_instance_id", id)
        .eq("tenant_id", tenantId);
        
      // Then delete the instance
      const { error } = await supabase
        .from("workflow_instances")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      toast.success("Workflow instance deleted successfully");
      fetchWorkflowInstances();
    } catch (error) {
      console.error("Error deleting workflow instance:", error);
      toast.error("Failed to delete workflow instance");
    }
  };

  const columns: Column<WorkflowInstance>[] = [
    {
      field: "workflow_name",
      header: "Workflow",
      sortable: true,
    },
    {
      field: "agent_name",
      header: "Agent",
      sortable: true,
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      render: (instance) => {
        const status = instance.status || "unknown";
        return (
          <Badge
            variant={
              status === "completed" ? "success" :
              status === "in_progress" ? "warning" :
              status === "error" ? "destructive" : "default"
            }
          >
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      field: "current_step",
      header: "Step",
      sortable: true,
    },
    {
      field: "created_at",
      header: "Started",
      sortable: true,
      render: (instance) => new Date(instance.created_at).toLocaleString(),
    },
    {
      field: "completed_at",
      header: "Completed",
      sortable: true,
      render: (instance) => instance.completed_at ? 
        new Date(instance.completed_at).toLocaleString() : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflow Executions</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Workflow</label>
          <Select value={filterWorkflow} onValueChange={setFilterWorkflow}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workflows</SelectItem>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Agent</label>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.human_name || agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DataTable
        data={instances}
        columns={columns}
        onRowClick={handleRowClick}
        permissions={{
          create: false,
          read: true,
          update: false,
          delete: true,
          export: true,
        }}
        onDelete={handleDeleteInstance}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        pageSize={10}
        emptyMessage="No workflow executions found."
      />

      {showResponsesDialog && selectedInstance && (
        <Dialog open={showResponsesDialog} onOpenChange={setShowResponsesDialog}>
          <DialogContent className="sm:max-w-[800px] sm:max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Workflow Execution Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Workflow:</h4>
                  <p>{selectedInstance.workflow_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Agent:</h4>
                  <p>{selectedInstance.agent_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Status:</h4>
                  <Badge
                    variant={
                      selectedInstance.status === "completed" ? "success" :
                      selectedInstance.status === "in_progress" ? "warning" :
                      selectedInstance.status === "error" ? "destructive" : "default"
                    }
                  >
                    {selectedInstance.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Current Step:</h4>
                  <p>{selectedInstance.current_step}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Started:</h4>
                  <p>{new Date(selectedInstance.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Completed:</h4>
                  <p>{selectedInstance.completed_at ? 
                    new Date(selectedInstance.completed_at).toLocaleString() : "—"}</p>
                </div>
              </div>
              
              <Tabs defaultValue="steps" className="w-full mt-6">
                <TabsList>
                  <TabsTrigger value="steps">Steps & Responses</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>
                <TabsContent value="steps" className="space-y-4 pt-4">
                  {instanceResponses.length === 0 ? (
                    <p className="text-muted-foreground">No responses recorded for this workflow execution.</p>
                  ) : (
                    <div className="space-y-4">
                      {instanceResponses.map((response) => (
                        <div key={response.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">Step {response.step_index + 1}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(response.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                response.status === "success" ? "success" :
                                response.status === "pending" ? "warning" :
                                response.status === "error" ? "destructive" : "default"
                              }
                            >
                              {response.status}
                            </Badge>
                          </div>
                          
                          {response.error_message && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                              <p className="text-red-700 text-sm">{response.error_message}</p>
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <h5 className="text-sm font-medium mb-1">Response:</h5>
                            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                              {JSON.stringify(response.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="raw" className="space-y-4 pt-4">
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                    {JSON.stringify({
                      instance: selectedInstance,
                      responses: instanceResponses,
                    }, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkflowInstancesSettings;
