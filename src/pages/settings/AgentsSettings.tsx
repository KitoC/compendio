import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IAiAgent } from "@/types/aiAgents";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

const AgentsSettings = () => {
  const { user, tenantId } = useAuth();
  const [agents, setAgents] = useState<IAiAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Partial<IAiAgent> | null>(
    null
  );

  const fetchAgents = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [user]);

  const handleEditAgent = (agent: IAiAgent) => {
    setCurrentAgent(agent);
    setIsDialogOpen(true);
  };

  const handleCreateAgent = () => {
    setCurrentAgent({
      name: "",
      human_name: "",
      responsibility: "",
      prompt: "",
      model: "gpt-4o-mini",
      enabled: true,
      tenant_id: tenantId || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!currentAgent || !user) return;

    setIsSubmitting(true);
    try {
      const isNewAgent = !currentAgent.id;
      const agentData = {
        ...currentAgent,
        tenant_id: tenantId,
      } as IAiAgent;

      let result;
      if (isNewAgent) {
        result = await supabase.from("ai_agents").insert([agentData]);
      } else {
        result = await supabase
          .from("ai_agents")
          .update(agentData)
          .eq("id", currentAgent.id);
      }

      if (result.error) throw result.error;

      toast.success(`Agent ${isNewAgent ? "created" : "updated"} successfully`);
      setIsDialogOpen(false);
      fetchAgents();
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error(`Failed to ${currentAgent.id ? "update" : "create"} agent`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", agentId);

      if (error) throw error;

      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium">AI Agents</h2>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations.
          </p>
        </div>
        <Button onClick={handleCreateAgent} className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span>Add Agent</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 border rounded-md bg-muted/30">
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first AI agent to get started.
          </p>
          <Button onClick={handleCreateAgent} className="mt-4">
            Create Agent
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.human_name || agent.name}</TableCell>
                <TableCell>{agent.model}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      agent.enabled
                        ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400"
                    }`}
                  >
                    {agent.enabled ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Pencil size={16} />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentAgent?.id ? "Edit Agent" : "Create New Agent"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Internal Name</Label>
                <Input
                  id="name"
                  value={currentAgent?.name || ""}
                  onChange={(e) =>
                    setCurrentAgent((prev) => ({
                      ...prev!,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. sales_assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="human_name">Display Name</Label>
                <Input
                  id="human_name"
                  value={currentAgent?.human_name || ""}
                  onChange={(e) =>
                    setCurrentAgent((prev) => ({
                      ...prev!,
                      human_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Sales Assistant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibility">Responsibility</Label>
              <Input
                id="responsibility"
                value={currentAgent?.responsibility || ""}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev!,
                    responsibility: e.target.value,
                  }))
                }
                placeholder="e.g. Helps with sales inquiries"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={currentAgent?.model || "gpt-4o-mini"}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev!,
                    model: e.target.value,
                  }))
                }
                placeholder="e.g. gpt-4o-mini"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                rows={5}
                value={currentAgent?.prompt || ""}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev!,
                    prompt: e.target.value,
                  }))
                }
                placeholder="Enter the system prompt for this agent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={currentAgent?.enabled}
                onCheckedChange={(checked) =>
                  setCurrentAgent((prev) => ({ ...prev!, enabled: checked }))
                }
              />
              <Label htmlFor="enabled">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAgent} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentsSettings;
