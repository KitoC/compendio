
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { IAiAgent } from "@/types/aiAgents";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROUTES } from "@/lib/constants";

const AgentsSettings = () => {
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<IAiAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

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

  const handleEditAgent = (agentId: string) => {
    navigate(`${ROUTES.SETTINGS}/agents/${agentId}`);
  };

  const handleCreateAgent = () => {
    navigate(`${ROUTES.SETTINGS}/agents/new`);
  };

  const openDeleteDialog = (agentId: string) => {
    setAgentToDelete(agentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;

    try {
      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", agentToDelete);

      if (error) throw error;

      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    } finally {
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
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
                      onClick={() => handleEditAgent(agent.id)}
                    >
                      <Pencil size={16} />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(agent.id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentsSettings;
