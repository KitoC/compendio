
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import DataTable, { Column } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkflowStepEditor from "@/components/workflow/WorkflowStepEditor";

interface Workflow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  created_by: string;
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_index: number;
  type: string;
  config: any;
  description: string;
  connected_service_id?: string;
  function_id?: string;
  created_at: string;
  tenant_id: string;
}

interface ConnectedService {
  id: string;
  name: string;
  service_type: string;
  status: string;
}

interface Function {
  id: string;
  name: string;
  description: string;
  type: string;
}

const WorkflowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow>({
    id: "",
    name: "",
    description: "",
    created_at: "",
    updated_at: "",
    tenant_id: tenantId || "",
    created_by: user?.id || "",
  });
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([]);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [currentTab, setCurrentTab] = useState("details");
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);

  const isNewWorkflow = id === "new";

  useEffect(() => {
    if (isNewWorkflow) {
      setIsLoading(false);
    } else {
      fetchWorkflow();
      fetchWorkflowSteps();
    }
    fetchConnectedServices();
    fetchFunctions();
  }, [id, tenantId]);

  const fetchWorkflow = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      if (data) {
        setWorkflow(data);
      }
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow details");
      navigate(`${ROUTES.SETTINGS}/workflows`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflowSteps = async () => {
    if (!tenantId || !id || isNewWorkflow) return;

    try {
      const { data, error } = await supabase
        .from("workflow_steps")
        .select("*")
        .eq("workflow_id", id)
        .eq("tenant_id", tenantId)
        .order("step_index", { ascending: true });

      if (error) throw error;
      setWorkflowSteps(data || []);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      toast.error("Failed to load workflow steps");
    }
  };

  const fetchConnectedServices = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("connected_services")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setConnectedServices(data || []);
    } catch (error) {
      console.error("Error fetching connected services:", error);
    }
  };

  const fetchFunctions = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("ai_functions")
        .select("id, name, description, type")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setFunctions(data || []);
    } catch (error) {
      console.error("Error fetching functions:", error);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!tenantId || !user) return;

    setIsSubmitting(true);
    try {
      const workflowData = {
        ...workflow,
        tenant_id: tenantId,
        created_by: user.id,
      };

      let result;
      if (isNewWorkflow) {
        result = await supabase.from("workflows").insert([workflowData]).select();
      } else {
        result = await supabase
          .from("workflows")
          .update(workflowData)
          .eq("id", id);
      }

      if (result.error) throw result.error;

      toast.success(`Workflow ${isNewWorkflow ? "created" : "updated"} successfully`);
      
      if (isNewWorkflow && result.data && result.data[0]) {
        navigate(`${ROUTES.SETTINGS}/workflows/${result.data[0].id}`);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error(`Failed to ${isNewWorkflow ? "create" : "update"} workflow`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setWorkflow((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: "",
      workflow_id: workflow.id,
      step_index: workflowSteps.length,
      type: "form",
      config: {},
      description: "",
      created_at: new Date().toISOString(),
      tenant_id: tenantId || "",
    };
    setCurrentStep(newStep);
    setShowStepEditor(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setCurrentStep(step);
    setShowStepEditor(true);
  };

  const handleSaveStep = async (step: WorkflowStep) => {
    try {
      const isNewStep = !step.id;
      
      if (isNewStep) {
        const { data, error } = await supabase
          .from("workflow_steps")
          .insert([{
            ...step,
            workflow_id: workflow.id,
            tenant_id: tenantId
          }])
          .select();
          
        if (error) throw error;
        toast.success("Step added successfully");
      } else {
        const { error } = await supabase
          .from("workflow_steps")
          .update(step)
          .eq("id", step.id)
          .eq("tenant_id", tenantId);
          
        if (error) throw error;
        toast.success("Step updated successfully");
      }
      
      fetchWorkflowSteps();
      setShowStepEditor(false);
      setCurrentStep(null);
    } catch (error) {
      console.error("Error saving step:", error);
      toast.error("Failed to save workflow step");
    }
  };

  const handleDeleteStep = async (id: string) => {
    try {
      // Delete the step
      const { error } = await supabase
        .from("workflow_steps")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Reindex remaining steps
      const remainingSteps = workflowSteps
        .filter(step => step.id !== id)
        .sort((a, b) => a.step_index - b.step_index);
        
      for (let i = 0; i < remainingSteps.length; i++) {
        await supabase
          .from("workflow_steps")
          .update({ step_index: i })
          .eq("id", remainingSteps[i].id)
          .eq("tenant_id", tenantId);
      }

      toast.success("Step deleted successfully");
      fetchWorkflowSteps();
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
    }
  };

  const handleMoveStep = async (step: WorkflowStep, direction: "up" | "down") => {
    try {
      const currentIndex = step.step_index;
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      
      // Ensure the new index is within bounds
      if (newIndex < 0 || newIndex >= workflowSteps.length) {
        return;
      }
      
      const otherStep = workflowSteps.find(s => s.step_index === newIndex);
      if (!otherStep) return;
      
      // Update the current step's index
      await supabase
        .from("workflow_steps")
        .update({ step_index: newIndex })
        .eq("id", step.id)
        .eq("tenant_id", tenantId);
        
      // Update the other step's index
      await supabase
        .from("workflow_steps")
        .update({ step_index: currentIndex })
        .eq("id", otherStep.id)
        .eq("tenant_id", tenantId);
      
      toast.success("Step order updated");
      fetchWorkflowSteps();
    } catch (error) {
      console.error("Error reordering steps:", error);
      toast.error("Failed to reorder steps");
    }
  };

  const stepsColumns: Column<WorkflowStep>[] = [
    {
      field: "step_index",
      header: "Order",
      sortable: true,
    },
    {
      field: "type",
      header: "Type",
      sortable: true,
    },
    {
      field: "description",
      header: "Description",
      sortable: true,
    },
    {
      field: "actions",
      header: "Actions",
      render: (step) => (
        <div className="flex space-x-2">
          {step.step_index > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveStep(step, "up");
              }}
            >
              Up
            </Button>
          )}
          {step.step_index < workflowSteps.length - 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveStep(step, "down");
              }}
            >
              Down
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
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
          onClick={() => navigate(`${ROUTES.SETTINGS}/workflows`)}
        >
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold">
          {isNewWorkflow ? "Create New Workflow" : "Edit Workflow"}
        </h2>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNewWorkflow && <TabsTrigger value="steps">Steps</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={workflow.name}
                    onChange={handleInputChange}
                    placeholder="Enter workflow name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={workflow.description}
                    onChange={handleInputChange}
                    placeholder="Describe the purpose of this workflow"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate(`${ROUTES.SETTINGS}/workflows`)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {!isNewWorkflow && (
          <TabsContent value="steps" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Workflow Steps</h3>
              <Button onClick={handleAddStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
            
            <DataTable
              data={workflowSteps}
              columns={stepsColumns}
              onRowClick={handleEditStep}
              permissions={{
                create: false,
                read: true,
                update: true,
                delete: true,
                export: false,
              }}
              onDelete={(id) => handleDeleteStep(id as string)}
              searchable={false}
              pagination={false}
              emptyMessage="No steps defined for this workflow yet. Add a step to get started."
            />

            {showStepEditor && currentStep && (
              <WorkflowStepEditor
                step={currentStep}
                functions={functions}
                connectedServices={connectedServices}
                onSave={handleSaveStep}
                onCancel={() => {
                  setShowStepEditor(false);
                  setCurrentStep(null);
                }}
              />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default WorkflowDetail;
