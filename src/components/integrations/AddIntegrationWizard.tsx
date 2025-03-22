
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES, ROUTES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { FormConfig } from "@/components/form-builder/types";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Mail,
  Workflow,
  Check,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Loader2,
} from "lucide-react";

interface AiAgent {
  id: string;
  name: string;
  human_name?: string;
  avatar_url?: string;
}

interface Credential {
  id: string;
  username: string;
  expires_at?: string;
  scopes?: string[];
  domain: string;
  type: string;
}

interface AddIntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIntegrationIcon = (type: string) => {
  switch (type) {
    case "mail":
      return <Mail className="h-6 w-6" />;
    case "workflow":
      return <Workflow className="h-6 w-6" />;
    default:
      return <Globe className="h-6 w-6" />;
  }
};

const AddIntegrationWizard = ({ isOpen, onClose }: AddIntegrationWizardProps) => {
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [existingCredentials, setExistingCredentials] = useState<Credential[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (selectedIntegrationType) {
      fetchExistingCredentials(selectedIntegrationType);
    }
  }, [selectedIntegrationType, tenantId]);

  const fetchAgents = async () => {
    if (!tenantId) return;

    try {
      setIsLoadingAgents(true);
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, human_name, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("enabled", true);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const fetchExistingCredentials = async (serviceType: string) => {
    if (!tenantId) return;

    try {
      setIsLoadingCredentials(true);
      const { data, error } = await supabase
        .from("credentials")
        .select("id, username, domain, expires_at, scopes, type")
        .eq("tenant_id", tenantId)
        .eq("domain", serviceType);

      if (error) throw error;
      setExistingCredentials(data || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleCreateIntegration = async () => {
    if (!tenantId || !selectedAgentId || !selectedIntegrationType) return;

    try {
      setIsSubmitting(true);

      const integrationConfig = {
        service_type: selectedIntegrationType,
        name: configValues.name as string || selectedIntegrationType,
        status: "active",
        agent_id: selectedAgentId,
        tenant_id: tenantId,
        config: configValues,
        auth_type: INTEGRATION_TYPES.find(t => t.id === selectedIntegrationType)?.authType || "custom"
      };

      const { data, error } = await supabase
        .from("connected_services")
        .insert([integrationConfig])
        .select();

      if (error) throw error;

      // If we have credential data, save it
      if (Object.keys(configValues).length > 0 && !selectedCredentialId) {
        const credentialData = {
          username: configValues.username as string || "default_user",
          password: configValues.api_token as string || "",
          domain: selectedIntegrationType,
          type: integrationConfig.auth_type,
          connected_service_id: data[0].id,
          tenant_id: tenantId
        };

        const { error: credError } = await supabase
          .from("credentials")
          .insert([credentialData]);

        if (credError) throw credError;
      } else if (selectedCredentialId) {
        // Link the existing credential to this service
        const { error: updateError } = await supabase
          .from("credentials")
          .update({ connected_service_id: data[0].id })
          .eq("id", selectedCredentialId)
          .eq("tenant_id", tenantId);

        if (updateError) throw updateError;
      }

      toast.success("Integration created successfully");
      onClose();
      setStep(1);
      setSelectedAgentId("");
      setSelectedIntegrationType("");
      setConfigValues({});
      navigate(ROUTES.SETTINGS_INTEGRATIONS);
    } catch (error) {
      console.error("Error creating integration:", error);
      toast.error("Failed to create integration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthRedirect = async (provider: string) => {
    if (!tenantId || !selectedAgentId) return;

    try {
      // This would need to be implemented to handle OAuth redirects
      // You'd likely store the current state in the database and then redirect
      toast.info(`OAuth flow for ${provider} would start here`);
      
      // Example implementation:
      // 1. Create a state record in oauth_states table
      // 2. Redirect to provider's OAuth endpoint
      // 3. Handle callback in a separate route
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      toast.error("Failed to start authentication flow");
    }
  };

  const handleFormSubmit = (values: Record<string, unknown>) => {
    setConfigValues({ ...configValues, ...values });
    nextStep();
  };

  const handleCredentialSelect = (credentialId: string) => {
    setSelectedCredentialId(credentialId);
    nextStep();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const resetAndClose = () => {
    setStep(1);
    setSelectedAgentId("");
    setSelectedIntegrationType("");
    setConfigValues({});
    setSelectedCredentialId("");
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 1: Select Agent</DialogTitle>
              <DialogDescription>
                Choose which AI agent will use this integration
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingAgents ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No agents found. Create an agent first.</p>
                  <Button onClick={() => navigate(ROUTES.SETTINGS_AGENTS)}>
                    Create Agent
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select
                    value={selectedAgentId}
                    onValueChange={setSelectedAgentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.human_name || agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!selectedAgentId || isLoadingAgents}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Select Integration Type</DialogTitle>
              <DialogDescription>
                Choose the type of service to connect
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTEGRATION_TYPES.map((integrationType) => (
                <Card 
                  key={integrationType.id} 
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedIntegrationType === integrationType.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedIntegrationType(integrationType.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getIntegrationIcon(integrationType.icon)}
                      </div>
                      {selectedIntegrationType === integrationType.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg">{integrationType.name}</CardTitle>
                    <CardDescription>{integrationType.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!selectedIntegrationType}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

      case 3: {
        const selectedType = INTEGRATION_TYPES.find(t => t.id === selectedIntegrationType);
        const authType = selectedType?.authType || "custom";
        
        if (isLoadingCredentials) {
          return (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 3: Configure Authentication</DialogTitle>
              <DialogDescription>
                {authType === "oauth" 
                  ? "Authenticate with your account" 
                  : "Enter your connection credentials"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {existingCredentials.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Use Existing Credentials</h3>
                  <div className="space-y-3">
                    {existingCredentials.map(cred => (
                      <Card 
                        key={cred.id} 
                        className={`cursor-pointer hover:border-primary transition-colors ${
                          selectedCredentialId === cred.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleCredentialSelect(cred.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cred.username}</p>
                              <p className="text-sm text-muted-foreground">
                                {cred.expires_at 
                                  ? `Expires: ${new Date(cred.expires_at).toLocaleDateString()}` 
                                  : "Never expires"}
                              </p>
                              {cred.scopes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Scopes: {cred.scopes.join(", ")}
                                </p>
                              )}
                            </div>
                            {selectedCredentialId === cred.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="border-t my-4"></div>
                  <h3 className="text-sm font-medium mb-2">Or Create New Credentials</h3>
                </div>
              )}

              {authType === "oauth" ? (
                <div className="flex justify-center py-6">
                  <Button 
                    onClick={() => handleOAuthRedirect(selectedType?.oauthProvider || "unknown")}
                    className="gap-2"
                    size="lg"
                  >
                    <LogIn className="h-5 w-5" />
                    {selectedType?.formConfig.submitButtonText || "Connect Account"}
                  </Button>
                </div>
              ) : (
                <FormBuilder
                  config={selectedType?.formConfig as FormConfig}
                  onSubmit={handleFormSubmit}
                />
              )}
            </div>
            {authType !== "oauth" ? null : (
              <DialogFooter>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            )}
          </>
        );
      }

      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 4: Optional Settings</DialogTitle>
              <DialogDescription>
                Customize your integration (optional)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FormBuilder
                config={{
                  id: "integration-settings",
                  title: "Integration Settings",
                  sections: [
                    {
                      id: "settings",
                      fields: [
                        {
                          id: "name",
                          name: "name",
                          label: "Integration Name",
                          type: "text",
                          placeholder: "My Integration",
                          defaultValue: configValues.name || selectedIntegrationType
                        },
                        {
                          id: "description",
                          name: "description",
                          label: "Description",
                          type: "textarea",
                          placeholder: "What will this integration be used for?"
                        }
                      ]
                    }
                  ],
                  submitButtonText: "Continue"
                }}
                onSubmit={handleFormSubmit}
              />
            </div>
          </>
        );

      case 5:
        const selectedType = INTEGRATION_TYPES.find(t => t.id === selectedIntegrationType);
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 5: Review and Save</DialogTitle>
              <DialogDescription>
                Confirm your integration details
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Agent</h3>
                    <p>{selectedAgent?.human_name || selectedAgent?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Service Type</h3>
                    <p>{selectedType?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Name</h3>
                    <p>{configValues.name || selectedType?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Authentication</h3>
                    <p>
                      {selectedCredentialId 
                        ? "Using existing credentials" 
                        : selectedType?.authType === "oauth" 
                          ? "OAuth" 
                          : "API Key / Custom"}
                    </p>
                  </div>
                </div>

                {configValues.description && (
                  <div>
                    <h3 className="text-sm font-medium">Description</h3>
                    <p>{configValues.description as string}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleCreateIntegration} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Connect and Save"
                )}
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Add Integration</h2>
            <div className="text-sm text-muted-foreground">
              Step {step} of 5
            </div>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AddIntegrationWizard;
