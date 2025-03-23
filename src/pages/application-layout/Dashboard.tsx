import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { MessageSquare, Activity, Settings, Plus } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
interface Conversation {
  id: string;
  title: string;
  created_at: string;
  agent_id?: string;
  message_count?: number;
}

interface Agent {
  id: string;
  name: string;
  human_name?: string;
  avatar_url?: string;
}

interface WorkflowInstance {
  id: string;
  status: string;
  current_step: number;
  workflow_id: string;
  created_at: string;
  completed_at?: string;
  workflow_name?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<
    WorkflowInstance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchDashboardData();
    }
  }, [tenantId]);

  const fetchDashboardData = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      // Fetch recent conversations
      const { data: convData } = await supabase
        .from("conversations")
        // .select(
        //   `
        //   *,
        //   tasks!inner(status)
        // `
        // )
        // .eq("tasks.user_id", user.id)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (convData) {
        setConversations(convData);
      }

      // Fetch agents
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("id, name, human_name, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("enabled", true);

      if (agentData) {
        setAgents(agentData);
      }

      // Fetch recent workflow instances with workflow names
      const { data: workflowData } = await supabase
        .from("workflow_instances")
        .select(
          `
          id, status, current_step, workflow_id, created_at, completed_at,
          workflows (name)
        `
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (workflowData) {
        // Transform to include workflow name
        const formattedWorkflows = workflowData.map((wi) => ({
          ...wi,
          workflow_name: wi.workflows?.name || "Unknown workflow",
        }));
        setWorkflowInstances(formattedWorkflows);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate(ROUTES.CHAT)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.SETTINGS)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Conversations Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Conversations</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(ROUTES.CHAT)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Your most recent chats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`${ROUTES.CHAT}/${conv.id}`)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">
                          {conv.title || "Untitled Conversation"}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No conversations yet</p>
                  <Button
                    variant="link"
                    onClick={() => navigate(ROUTES.CHAT)}
                    className="mt-2"
                  >
                    Start a new chat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agents Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>AI Agents</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(ROUTES.SETTINGS_AGENTS)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Your AI assistants</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : agents.length > 0 ? (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                      onClick={() =>
                        navigate(`${ROUTES.SETTINGS_AGENTS}/${agent.id}`)
                      }
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="text-sm font-medium text-primary">
                              {(agent.human_name || agent.name)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium">
                          {agent.human_name || agent.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No agents configured</p>
                  <Button
                    variant="link"
                    onClick={() => navigate(ROUTES.SETTINGS_AGENTS)}
                    className="mt-2"
                  >
                    Create an agent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Executions Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Workflows</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(ROUTES.SETTINGS_WORKFLOWS)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Latest workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : workflowInstances.length > 0 ? (
                <div className="space-y-3">
                  {workflowInstances.map((instance) => (
                    <div
                      key={instance.id}
                      className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                      onClick={() =>
                        navigate(
                          `${ROUTES.SETTINGS_WORKFLOW_INSTANCES}/${instance.id}`
                        )
                      }
                    >
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">
                          {instance.workflow_name}
                        </h3>
                        <span className="text-xs">
                          {new Date(instance.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          <span className="text-xs text-muted-foreground">
                            Step {instance.current_step}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            instance.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : instance.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {instance.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No workflow executions yet</p>
                  <Button
                    variant="link"
                    onClick={() => navigate(ROUTES.SETTINGS_WORKFLOWS)}
                    className="mt-2"
                  >
                    Create a workflow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
