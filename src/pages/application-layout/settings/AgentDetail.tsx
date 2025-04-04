import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IAiAgent } from "@/types/aiAgents";
import { ROUTES } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Workflow } from "lucide-react";
import FunctionSelector from "@/components/selectors/FunctionSelector";
import { useTenant } from "@/contexts/TenantContext";
interface AIFunction {
  id: string;
  name: string;
  description: string;
  type: string;
}

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agent, setAgent] = useState<Partial<IAiAgent>>({
    name: "",
    human_name: "",
    responsibility: "",
    prompt: "",
    model: "gpt-4o-mini",
    enabled: true,
    tenant_id: tenantId || "",
  });
  const [selectedFunctions, setSelectedFunctions] = useState<AIFunction[]>([]);

  useEffect(() => {
    if (id !== "new") {
      fetchAgent();
      fetchAgentFunctions();
    } else {
      setIsLoading(false);
    }
  }, [id, tenantId]);

  const fetchAgent = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      if (data) {
        setAgent(data);
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
      toast.error("Failed to load agent details");
      navigate(`${ROUTES.SETTINGS}/agents`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentFunctions = async () => {
    if (!tenantId || !id) return;

    try {
      const { data, error } = await supabase
        .from("agent_functions")
        .select(
          `
          function_id,
          ai_functions:function_id (
            id,
            name,
            description,
            type
          )
        `
        )
        .eq("agent_id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      if (data) {
        const functions = data.map((item) => ({
          id: item.ai_functions.id,
          name: item.ai_functions.name,
          description: item.ai_functions.description,
          type: item.ai_functions.type,
        }));

        setSelectedFunctions(functions);
      }
    } catch (error) {
      console.error("Error fetching agent functions:", error);
      toast.error("Failed to load agent functions");
    }
  };

  const handleSaveAgent = async () => {
    if (!tenantId || !user) return;

    setIsSubmitting(true);
    try {
      const isNewAgent = id === "new";
      const agentData = {
        ...agent,
        tenant_id: tenantId,
      } as IAiAgent;

      let result;
      if (isNewAgent) {
        result = await supabase.from("ai_agents").insert([agentData]).select();
      } else {
        result = await supabase
          .from("ai_agents")
          .update(agentData)
          .eq("id", id);
      }

      if (result.error) throw result.error;

      toast.success(`Agent ${isNewAgent ? "created" : "updated"} successfully`);
      navigate(`${ROUTES.SETTINGS}/agents`);
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error(`Failed to ${id === "new" ? "create" : "update"} agent`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setAgent((prev) => ({ ...prev!, [id]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setAgent((prev) => ({ ...prev!, enabled: checked }));
  };

  const handleManageWorkflows = () => {
    if (id) {
      navigate(`/settings/agents/${id}/workflows`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`${ROUTES.SETTINGS}/agents`)}
          >
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-2xl font-medium">
            {id === "new" ? "Create New Agent" : "Edit Agent"}
          </h2>
        </div>

        {id !== "new" && (
          <Button variant="outline" onClick={handleManageWorkflows}>
            <Workflow className="h-4 w-4 mr-2" />
            Manage Workflows
          </Button>
        )}
      </div>

      <Card className="flex-1 overflow-y-auto">
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 py-4 ">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Internal Name</Label>
                <Input
                  id="name"
                  value={agent?.name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. sales_assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="human_name">Display Name</Label>
                <Input
                  id="human_name"
                  value={agent?.human_name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. Sales Assistant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibility">Responsibility</Label>
              <Input
                id="responsibility"
                value={agent?.responsibility || ""}
                onChange={handleInputChange}
                placeholder="e.g. Helps with sales inquiries"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={agent?.model || "gpt-4o-mini"}
                onChange={handleInputChange}
                placeholder="e.g. gpt-4o-mini"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                rows={5}
                value={agent?.prompt || ""}
                onChange={handleInputChange}
                placeholder="Enter the system prompt for this agent"
              />
            </div>

            <div className="space-y-2">
              <Label>AI Functions</Label>
              <FunctionSelector
                agentId={id || ""}
                selectedFunctions={selectedFunctions}
                onFunctionsChange={setSelectedFunctions}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={agent?.enabled}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="enabled">Active</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`${ROUTES.SETTINGS}/agents`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveAgent} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AgentDetail;
