
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DataTable, { Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceConnectionModal from "@/components/integrations/ServiceConnectionModal";
import WebhookEventsTable from "@/components/integrations/WebhookEventsTable";

interface ConnectedService {
  id: string;
  service_type: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  auth_type: string;
  config: any;
}

interface Credential {
  id: string;
  username: string;
  domain: string;
  connected_service_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

const IntegrationsSettings = () => {
  const { tenantId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ConnectedService | null>(null);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    fetchServices();
    fetchCredentials();
  }, [tenantId]);

  const fetchServices = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("connected_services")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load connected services");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCredentials = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: ConnectedService) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (service: ConnectedService) => {
    if (!tenantId) return;

    try {
      const isNew = !service.id;
      
      if (isNew) {
        const { data, error } = await supabase
          .from("connected_services")
          .insert([{ ...service, tenant_id: tenantId }])
          .select();

        if (error) throw error;
        toast.success("Service added successfully");
      } else {
        const { error } = await supabase
          .from("connected_services")
          .update(service)
          .eq("id", service.id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        toast.success("Service updated successfully");
      }
      
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Failed to save service connection");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!tenantId) return;

    try {
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
      toast.success("Service deleted successfully");
      fetchServices();
      fetchCredentials();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const serviceColumns: Column<ConnectedService>[] = [
    {
      field: "name",
      header: "Name",
      sortable: true,
    },
    {
      field: "service_type",
      header: "Service Type",
      sortable: true,
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
              status === "active" ? "success" :
              status === "pending" ? "warning" :
              status === "error" ? "destructive" : "default"
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
    },
    {
      field: "created_at",
      header: "Created",
      sortable: true,
      render: (service) => new Date(service.created_at).toLocaleDateString(),
    },
  ];

  const credentialColumns: Column<Credential>[] = [
    {
      field: "username",
      header: "Username",
      sortable: true,
    },
    {
      field: "domain",
      header: "Domain",
      sortable: true,
    },
    {
      field: "connected_service_id",
      header: "Service",
      sortable: true,
      render: (credential) => {
        const service = services.find(s => s.id === credential.connected_service_id);
        return service ? service.name : "Unknown";
      },
    },
    {
      field: "expires_at",
      header: "Expires",
      sortable: true,
      render: (credential) => credential.expires_at ? 
        new Date(credential.expires_at).toLocaleDateString() : "Never",
    },
    {
      field: "created_at",
      header: "Created",
      sortable: true,
      render: (credential) => new Date(credential.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <Button onClick={handleAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
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
            onRowClick={handleEditService}
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
            onDelete={(id) => {
              if (typeof id === 'string') {
                supabase
                  .from("credentials")
                  .delete()
                  .eq("id", id)
                  .eq("tenant_id", tenantId)
                  .then(() => {
                    toast.success("Credential deleted");
                    fetchCredentials();
                  })
                  .catch((error) => {
                    toast.error("Failed to delete credential");
                    console.error(error);
                  });
              }
            }}
            isLoading={isLoading}
            searchable={true}
            pagination={true}
            pageSize={10}
            emptyMessage="No credentials found."
          />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 pt-4">
          <WebhookEventsTable tenantId={tenantId} />
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <ServiceConnectionModal
          service={selectedService}
          onSave={handleSaveService}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IntegrationsSettings;
