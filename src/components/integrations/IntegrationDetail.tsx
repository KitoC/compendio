
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROUTES, INTEGRATION_TYPES } from "@/lib/constants";
import WebhookEventsTable from "@/components/integrations/WebhookEventsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trash2,
  RefreshCcw,
  Box,
  Calendar,
  LogIn,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConnectedService {
  id: string;
  service_type: string;
  name: string;
  status: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
  config: any;
  auth_type: string;
}

interface Credential {
  id: string;
  username: string;
  domain: string;
  scopes: string[];
  expires_at: string;
  connected_service_id: string;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: string;
  name: string;
  human_name?: string;
  avatar_url?: string;
}

const IntegrationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<ConnectedService | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  
  useEffect(() => {
    if (tenantId && id) {
      fetchServiceDetails();
    }
  }, [tenantId, id]);
  
  const fetchServiceDetails = async () => {
    if (!tenantId || !id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch the service
      const { data: serviceData, error: serviceError } = await supabase
        .from("connected_services")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();
      
      if (serviceError) throw serviceError;
      setService(serviceData);
      
      // Fetch related credential
      if (serviceData) {
        const { data: credData, error: credError } = await supabase
          .from("credentials")
          .select("id, username, domain, scopes, expires_at, connected_service_id, created_at, updated_at")
          .eq("connected_service_id", serviceData.id)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        
        if (credError) throw credError;
        setCredential(credData);
        
        // Fetch agent
        if (serviceData.agent_id) {
          const { data: agentData, error: agentError } = await supabase
            .from("ai_agents")
            .select("id, name, human_name, avatar_url")
            .eq("id", serviceData.agent_id)
            .eq("tenant_id", tenantId)
            .single();
          
          if (agentError) throw agentError;
          setAgent(agentData);
        }
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to load integration details");
      navigate(ROUTES.SETTINGS_INTEGRATIONS);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!tenantId || !id) return;
    
    try {
      setIsDeletingService(true);
      
      // Delete associated credentials first
      if (credential) {
        await supabase
          .from("credentials")
          .delete()
          .eq("id", credential.id)
          .eq("tenant_id", tenantId);
      }
      
      // Delete the service
      const { error } = await supabase
        .from("connected_services")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      
      if (error) throw error;
      
      toast.success("Integration deleted successfully");
      navigate(ROUTES.SETTINGS_INTEGRATIONS);
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete integration");
    } finally {
      setIsDeletingService(false);
      setShowDeleteDialog(false);
    }
  };
  
  const handleReconnect = async () => {
    // This would trigger a reconnection flow
    // For OAuth, it would start a new OAuth flow
    // For API keys, it would open a form to update credentials
    toast.info("Reconnection flow would start here");
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Integration Not Found</h2>
        <Button onClick={() => navigate(ROUTES.SETTINGS_INTEGRATIONS)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>
      </div>
    );
  }
  
  const integrationTypeInfo = INTEGRATION_TYPES.find(t => t.id === service.service_type);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTES.SETTINGS_INTEGRATIONS)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{service.name || integrationTypeInfo?.name || service.service_type}</h1>
          <Badge
            variant={
              service.status === "active" ? "success" :
              service.status === "pending" ? "warning" :
              service.status === "error" ? "destructive" : "default"
            }
          >
            {service.status}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleReconnect}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Details</CardTitle>
            <CardDescription>Service configuration information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Service Type</h3>
              <p>{integrationTypeInfo?.name || service.service_type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Auth Type</h3>
              <p>{service.auth_type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Connected Agent</h3>
              <p>
                {agent ? (agent.human_name || agent.name) : "None"}
                {agent && agent.avatar_url && (
                  <img 
                    src={agent.avatar_url} 
                    alt={agent.name} 
                    className="w-6 h-6 rounded-full inline-block ml-2"
                  />
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Created</h3>
              <p>{new Date(service.created_at).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Last Updated</h3>
              <p>{new Date(service.updated_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Credential Information</CardTitle>
            <CardDescription>Authentication details</CardDescription>
          </CardHeader>
          <CardContent>
            {credential ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Username</h3>
                  <p>{credential.username}</p>
                </div>
                {credential.scopes && credential.scopes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Permissions</h3>
                    <div className="flex flex-wrap gap-1">
                      {credential.scopes.map((scope, index) => (
                        <Badge key={index} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {credential.expires_at && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Expires</h3>
                    <p>{new Date(credential.expires_at).toLocaleString()}</p>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Credentials are securely stored and encrypted
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No credentials found for this integration</p>
                <Button onClick={handleReconnect}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Add Credentials
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integration Usage</CardTitle>
            <CardDescription>Connected workflows and usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-2 rounded-md bg-primary/5">
                <Box className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-medium">0 Workflows</h3>
                  <p className="text-sm text-muted-foreground">Using this integration</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 rounded-md bg-primary/5">
                <Calendar className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-medium">0 Events</h3>
                  <p className="text-sm text-muted-foreground">Past 30 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <WebhookEventsTable tenantId={tenantId} />
      </div>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this integration? This action cannot be undone, 
              and all related credentials will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeletingService}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeletingService}
            >
              {isDeletingService ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Integration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationDetail;
