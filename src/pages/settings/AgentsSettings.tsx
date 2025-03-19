import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IAiAgent } from "@/types/aiAgents";
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
import DataTable, { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

const columns: Column<IAiAgent>[] = [
  {
    field: "name",
    header: "Name",
    sortable: true,
  },
  {
    field: "human_name",
    header: "Display name",
    sortable: true,
    render: (agent) => {
      return agent.human_name || agent.name;
    },
  },
  {
    field: "model",
    header: "Model",
    sortable: true,
  },
  {
    field: "enabled",
    header: "Status",
    sortable: true,
    render: (agent) => {
      return agent.enabled ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="error">Inactive</Badge>
      );
    },
  },
];

const AgentsSettings = () => {
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<IAiAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const fetchAgents = async () => {
    if (!user || !tenantId) return;

    try {
      setIsLoading(true);

      console.log("fetching agents", tenantId);
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

  const handleSaveAgent = async (agent: IAiAgent) => {
    if (!tenantId || !user) return;

    try {
      const isNewAgent = !agent.id;
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
          .eq("id", agent.id);
      }

      if (result.error) throw result.error;

      toast.success(`Agent ${isNewAgent ? "created" : "updated"} successfully`);
      navigate(`${ROUTES.SETTINGS}/agents`);
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error(`Failed to ${!agent.id ? "create" : "update"} agent`);
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        data={agents}
        columns={columns}
        title="Ai Agents"
        subtitle="Manage your AI agents and their configurations."
        permissions={{
          create: true,
          read: true,
          update: true,
          delete: true,
          export: false,
        }}
        onUpdate={handleSaveAgent}
        onCreate={handleSaveAgent}
        onDelete={handleDeleteAgent}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        pageSize={5}
      />

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
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentsSettings;
