import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROUTES, INTEGRATION_TYPES } from "@/lib/constants";
import DataTable, { Column } from "@/components/data-table";
import AddIntegrationWizard from "@/components/integrations/AddIntegrationWizard";
import WebhookEventsTable from "@/components/integrations/WebhookEventsTable";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectedService, Credential } from "@/forms/types";
import { useTenant } from "@/contexts/TenantContext";

const IntegrationsSettings = () => {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    if (tenantId) {
      fetchServices();
      fetchCredentials();
    }
  }, [tenantId]);

  useEffect(() => {
    if (sessionStorage.getItem("integration_wizard_state")) {
      setIsWizardOpen(true);
    }
  }, []);

  const fetchServices = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);

      // Fetch services with agent names
      const { data, error } = await supabase
        .from("connected_services")
        .select(
          `
          *,
          ai_agents (
            name,
            human_name,
            enabled
          )
        `
        )
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Transform data to include agent name
      const servicesWithAgentNames = data?.map((service) => ({
        ...service,
        agent_name: service.ai_agents?.name || "Unknown agent",
        name: service.name || getServiceTypeName(service.service_type), // Ensure name is always set
        auth_type: service.auth_type || "custom", // Ensure auth_type is always set
      })) as ConnectedService[];

      setServices(servicesWithAgentNames);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load connected services");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = useCallback(async () => {
    if (!tenantId) return;

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) throw error;

    setAgents(data || []);
  }, [tenantId]);

  const fetchCredentials = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Convert numeric IDs to strings to avoid TypeScript issues
      const processedCredentials = (data || []).map((cred) => ({
        ...cred,
        id: String(cred.id),
      })) as Credential[];

      setCredentials(processedCredentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!tenantId) return;

    try {
      // First delete any associated credentials

      // Then delete the service
      const { error } = await supabase
        .from("connected_services")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      toast.success("Service deleted successfully");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const handleReconnect = (service: ConnectedService) => {
    // Implement reconnect logic here
    toast.info(`Reconnecting ${service.name || service.service_type}...`);
  };

  const getServiceTypeName = (serviceType: string) => {
    const integrationType = INTEGRATION_TYPES.find((t) => t.id === serviceType);
    return integrationType?.name || serviceType;
  };

  const serviceColumns: Column<ConnectedService>[] = [
    {
      field: "name",
      header: "Name",
      sortable: true,
      render: (service) =>
        service.name || getServiceTypeName(service.service_type),
    },
    {
      field: "service_type",
      header: "Service Type",
      sortable: true,
      render: (service) => getServiceTypeName(service.service_type),
    },
    {
      field: "agent_id",
      header: "Agent",
      sortable: true,
      render: (service) => {
        const agent = agents.find((a) => a.id === service.agent_id);
        if (!agent) return "Unknown agent";

        return (
          <Badge variant={agent.enabled ? "outline-success" : "outline-error"}>
            <Bot className="h-4 w-4 mr-1" />
            {agent.human_name || agent.name}
          </Badge>
        );
      },
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      render: (service) => {
        const status = service.status || "unknown";
        return (
          <Badge
            variant={
              status === "active"
                ? "success"
                : status === "pending"
                ? "warning"
                : status === "error"
                ? "destructive"
                : "default"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      field: "auth_type",
      header: "Auth Type",
      sortable: true,
      render: (service) => {
        const credential = credentials.find(
          (c) => c.id === service.credential_id
        );

        return credential?.type || "Unknown";
      },
    },
    {
      field: "created_at",
      header: "Created",
      sortable: true,
      render: (service) =>
        new Date(service.created_at || "").toLocaleDateString(),
    },
    // {
    //   field: "actions",
    //   header: "Actions",
    //   render: (service) => (
    //     <Button
    //       variant="outline"
    //       size="sm"
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         handleReconnect(service);
    //       }}
    //     >
    //       <RefreshCcw className="h-4 w-4 mr-1" />
    //       Reconnect
    //     </Button>
    //   ),
    // },
  ];

  const credentialColumns: Column<Credential>[] = [
    {
      field: "name",
      header: "Name",
      sortable: true,
    },
    {
      field: "username",
      header: "Username",
      sortable: true,
    },
    {
      field: "domain",
      header: "Domain",
      sortable: true,
      render: (credential) => getServiceTypeName(credential.domain),
    },
    {
      field: "type",
      header: "Auth Type",
      sortable: true,
    },
    {
      field: "expires_at",
      header: "Expires",
      sortable: true,
      render: (credential) =>
        credential.expires_at
          ? new Date(credential.expires_at).toLocaleDateString()
          : "Never",
    },
    {
      field: "created_at",
      header: "Created",
      sortable: true,
      render: (credential) =>
        new Date(credential.created_at).toLocaleDateString(),
    },
  ];

  const handleDeleteCredential = async (id: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from("credentials")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Credential deleted");
      fetchCredentials();
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast.error("Failed to delete credential");
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchAgents();
    }
  }, [tenantId, fetchAgents]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 pt-4">
          <DataTable
            data={services}
            columns={serviceColumns}
            permissions={{
              create: false,
              read: true,
              update: true,
              delete: true,
              export: false,
            }}
            onDelete={handleDeleteService}
            isLoading={isLoading}
            searchable={true}
            pagination={true}
            pageSize={10}
            emptyMessage="No connected services. Add a service to get started."
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4 pt-4">
          <DataTable
            data={credentials}
            columns={credentialColumns}
            permissions={{
              create: false,
              read: true,
              update: false,
              delete: true,
              export: false,
            }}
            onDelete={handleDeleteCredential}
            isLoading={isLoading}
            searchable={true}
            pagination={true}
            pageSize={10}
            emptyMessage="No credentials found."
          />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 pt-4">
          <WebhookEventsTable tenantId={tenantId || ""} />
        </TabsContent>
      </Tabs>

      <AddIntegrationWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          fetchServices();
          fetchCredentials();
        }}
      />
    </div>
  );
};

export default IntegrationsSettings;
