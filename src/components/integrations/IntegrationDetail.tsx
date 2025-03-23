import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES, INTEGRATION_TYPES } from "@/lib/constants";
import WebhookEventsTable from "./WebhookEventsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCcw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/TenantContext";
interface Credential {
  id: string;
  username: string;
  domain: string;
  connected_service_id: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  scopes?: string[];
}

interface ConnectedService {
  id: string;
  service_type: string;
  name: string;
  agent_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  tenant_id: string;
  workflow_instance_id?: string;
  auth_type: string;
  config: Record<string, unknown>;
}

interface Agent {
  id: string;
  name: string;
  human_name?: string;
  avatar_url?: string;
}

const IntegrationDetail = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<ConnectedService | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!tenantId || !id) return;
    fetchServiceDetails();
  }, [tenantId, id]);

  const fetchServiceDetails = async () => {
    if (!tenantId || !id) return;

    try {
      // Fetch connected service
      const { data: serviceData, error: serviceError } = await supabase
        .from("connected_services")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (serviceError) throw serviceError;

      // Type assertion
      const typedService = serviceData as unknown as ConnectedService;
      setService(typedService);

      if (typedService.agent_id) {
        // Fetch agent details
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("id, name, human_name, avatar_url")
          .eq("id", typedService.agent_id)
          .single();

        if (!agentError && agentData) {
          setAgent(agentData);
        }
      }

      // Fetch credentials
      const { data: credData, error: credError } = await supabase
        .from("credentials")
        .select("*")
        .eq("connected_service_id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (!credError && credData) {
        // Type assertion for credential
        const typedCredential = credData as unknown as Credential;
        setCredential(typedCredential);
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to load integration details");
      // Navigate back on error
      navigate(ROUTES.SETTINGS_INTEGRATIONS);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !id) return;

    try {
      setIsDeleting(true);

      // First delete any associated credentials
      await supabase
        .from("credentials")
        .delete()
        .eq("connected_service_id", id)
        .eq("tenant_id", tenantId);

      // Then delete the service
      const { error } = await supabase
        .from("connected_services")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Integration deleted successfully");
      navigate(ROUTES.SETTINGS_INTEGRATIONS);
    } catch (error) {
      console.error("Error deleting integration:", error);
      toast.error("Failed to delete integration");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReconnect = async () => {
    if (!service) return;

    setIsReconnecting(true);

    try {
      // Implement reconnection logic
      // This would typically involve:
      // 1. For OAuth: Redirect to auth page
      // 2. For API key: Show form to update credentials

      // For now, just update status to show it was attempted
      const { error } = await supabase
        .from("connected_services")
        .update({ status: "reconnecting" })
        .eq("id", service.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Reconnection initiated");

      // Refresh service details
      fetchServiceDetails();
    } catch (error) {
      console.error("Error reconnecting:", error);
      toast.error("Failed to reconnect");
    } finally {
      setIsReconnecting(false);
    }
  };

  const getServiceTypeName = (serviceType: string) => {
    const integrationType = INTEGRATION_TYPES.find((t) => t.id === serviceType);
    return integrationType?.name || serviceType;
  };

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Integration Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The integration you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => navigate(ROUTES.SETTINGS_INTEGRATIONS)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTES.SETTINGS_INTEGRATIONS)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {service.name || getServiceTypeName(service.service_type)}
          </h1>
          <Badge
            variant={
              service.status === "active"
                ? "success"
                : service.status === "pending"
                ? "warning"
                : service.status === "error"
                ? "destructive"
                : "default"
            }
          >
            {service.status}
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleReconnect}
            disabled={isReconnecting}
          >
            {isReconnecting ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reconnect
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Webhook Events</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Details</CardTitle>
              <CardDescription>
                Basic information about this integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Service Type</h3>
                  <p>{getServiceTypeName(service.service_type)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Authentication Type</h3>
                  <p className="capitalize">{service.auth_type}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Connected Agent</h3>
                  <p>
                    {agent ? agent.human_name || agent.name : "Unknown Agent"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Created</h3>
                  <p>{new Date(service.created_at).toLocaleDateString()}</p>
                </div>

                {service.config && service.config.description && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium">Description</h3>
                    <p>{service.config.description as string}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {service.config && Object.keys(service.config).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Service configuration details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(service.config)
                    .filter(
                      ([key]) =>
                        ![
                          "password",
                          "api_token",
                          "secret",
                          "token",
                          "apiKey",
                        ].includes(key)
                    ) // Filter out sensitive fields
                    .map(([key, value]) => (
                      <div key={key}>
                        <h3 className="text-sm font-medium capitalize">
                          {key.replace("_", " ")}
                        </h3>
                        <p>
                          {typeof value === "string"
                            ? value
                            : JSON.stringify(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="pt-4">
          <WebhookEventsTable tenantId={tenantId} serviceId={service.id} />
        </TabsContent>

        <TabsContent value="credentials" className="pt-4">
          {credential ? (
            <Card>
              <CardHeader>
                <CardTitle>Credential Information</CardTitle>
                <CardDescription>
                  Authentication details for this integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Username</h3>
                    <p>{credential.username}</p>
                  </div>

                  {credential.expires_at && (
                    <div>
                      <h3 className="text-sm font-medium">Expires</h3>
                      <p>
                        {new Date(credential.expires_at).toLocaleDateString()}
                        {new Date(credential.expires_at) < new Date() && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </p>
                    </div>
                  )}

                  {credential.scopes && credential.scopes.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium">Scopes</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {credential.scopes.map((scope) => (
                          <Badge key={scope} variant="outline">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium">Created</h3>
                    <p>
                      {new Date(credential.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Updated</h3>
                    <p>
                      {new Date(credential.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">
                        Credential Security
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        For security reasons, access tokens and secrets are
                        encrypted and cannot be displayed. If you need to update
                        credentials, use the Reconnect button.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h2 className="text-xl font-medium mb-2">
                  No Credentials Found
                </h2>
                <p className="text-muted-foreground mb-4">
                  This integration doesn't have any stored credentials.
                </p>
                <Button onClick={handleReconnect}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Set Up Credentials
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDetail;
