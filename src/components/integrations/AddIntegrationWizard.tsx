
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES, ROUTES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { newAgentFormConfig } from "@/forms/agents";
import { integrationSettingsConfig, INTEGRATION_FORM_CONFIGS } from "@/forms/integrations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Globe,
  Mail,
  Workflow,
  Check,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Loader2,
  Plus,
  CheckCircle2,
  User,
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

// Interface for storing wizard state
interface WizardState {
  step: number;
  selectedAgentId: string;
  selectedIntegrationType: string;
  selectedCredentialId: string;
  configValues: Record<string, unknown>;
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

const AddIntegrationWizard = ({
  isOpen,
  onClose,
}: AddIntegrationWizardProps) => {
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
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentData, setNewAgentData] = useState<Record<string, unknown>>({});
  const [restoringState, setRestoringState] = useState(false);
  const [isOAuthSuccess, setIsOAuthSuccess] = useState(false);
  const [availableCredentialsByType, setAvailableCredentialsByType] = useState<Credential[]>([]);

  // Restore wizard state from session storage if available
  useEffect(() => {
    if (isOpen) {
      try {
        // Check if we have an OAuth success flag
        const oauthSuccess = sessionStorage.getItem("oauth_success");
        if (oauthSuccess === "true") {
          setIsOAuthSuccess(true);
          // Clear the flag so it doesn't show up again
          sessionStorage.removeItem("oauth_success");
          
          // Get the last credential ID if available
          const lastCredentialId = sessionStorage.getItem("last_credential_id");
          if (lastCredentialId) {
            setSelectedCredentialId(lastCredentialId);
            sessionStorage.removeItem("last_credential_id");
          }
        }
        
        const savedStateString = sessionStorage.getItem("integration_wizard_state");
        
        if (savedStateString) {
          setRestoringState(true);
          const savedState: WizardState = JSON.parse(savedStateString);
          
          setStep(savedState.step);
          setSelectedAgentId(savedState.selectedAgentId);
          setSelectedIntegrationType(savedState.selectedIntegrationType);
          setSelectedCredentialId(savedState.selectedCredentialId || "");
          setConfigValues(savedState.configValues);
          
          // Slight delay to avoid fetch conflicts
          setTimeout(() => {
            setRestoringState(false);
          }, 100);
        }
      } catch (error) {
        console.error("Error restoring wizard state:", error);
      }
    }
  }, [isOpen]);

  // Only fetch agents when the dialog is opened and not in agent creation mode
  useEffect(() => {
    if (isOpen && !isCreatingAgent && !restoringState) {
      fetchAgents();
    }
  }, [isOpen, tenantId, isCreatingAgent, restoringState]);

  // Only fetch credentials when an integration type is selected
  useEffect(() => {
    if (selectedIntegrationType && !restoringState) {
      fetchExistingCredentials(selectedIntegrationType);
      
      // Fetch reusable credentials by type regardless of connected service
      if (tenantId) {
        fetchCredentialsByType(selectedIntegrationType);
      }
    }
  }, [selectedIntegrationType, tenantId, restoringState]);

  // Save wizard state whenever key fields change
  useEffect(() => {
    if (isOpen && !restoringState) {
      const currentState: WizardState = {
        step,
        selectedAgentId,
        selectedIntegrationType,
        selectedCredentialId,
        configValues
      };
      
      sessionStorage.setItem("integration_wizard_state", JSON.stringify(currentState));
    }
  }, [isOpen, step, selectedAgentId, selectedIntegrationType, selectedCredentialId, configValues, restoringState]);

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
      // Convert numeric IDs to strings to avoid TypeScript issues
      const credentialsData = (data || []).map(cred => ({
        ...cred,
        id: String(cred.id)
      }));
      setExistingCredentials(credentialsData);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const fetchCredentialsByType = async (serviceType: string) => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("id, username, domain, expires_at, scopes, type")
        .eq("tenant_id", tenantId)
        .eq("domain", serviceType)
        .is("connected_service_id", null);

      if (error) throw error;
      
      // Convert numeric IDs to strings to avoid TypeScript issues
      const credentialsData = (data || []).map(cred => ({
        ...cred,
        id: String(cred.id)
      }));
      
      setAvailableCredentialsByType(credentialsData);
    } catch (error) {
      console.error("Error fetching reusable credentials:", error);
    }
  };

  const handleCreateAgent = async (values: Record<string, unknown>) => {
    if (!tenantId) return;

    try {
      setIsSubmitting(true);
      
      // Convert enabled boolean if it exists
      const agentData = {
        ...values,
        enabled: values.enabled === undefined ? true : Boolean(values.enabled),
        tenant_id: tenantId
      };
      
      const { data, error } = await supabase
        .from("ai_agents")
        .insert([agentData])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setNewAgentData(data[0]);
        setSelectedAgentId(data[0].id);
        toast.success("Agent created successfully");
        
        // Refresh agents list
        await fetchAgents();
        
        // Exit creation mode and continue wizard
        setIsCreatingAgent(false);
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateIntegration = async () => {
    if (!tenantId || !selectedAgentId || !selectedIntegrationType) return;

    try {
      setIsSubmitting(true);

      const integrationConfig = {
        service_type: selectedIntegrationType,
        name: (configValues.name as string) || selectedIntegrationType,
        status: "active",
        agent_id: selectedAgentId,
        tenant_id: tenantId,
        config: configValues,
        auth_type:
          INTEGRATION_TYPES.find((t) => t.id === selectedIntegrationType)
            ?.authType || "custom",
      };

      const { data, error } = await supabase
        .from("connected_services")
        .insert([integrationConfig])
        .select();

      if (error) throw error;

      // If we have credential data, save it
      if (Object.keys(configValues).length > 0 && !selectedCredentialId) {
        const credentialData = {
          username: (configValues.username as string) || "default_user",
          password: (configValues.api_token as string) || "",
          domain: selectedIntegrationType,
          type: integrationConfig.auth_type,
          connected_service_id: data[0].id,
          tenant_id: tenantId,
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
      setSelectedCredentialId("");
      setIsOAuthSuccess(false);
      // Clear session storage
      sessionStorage.removeItem("integration_wizard_state");
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
      setIsSubmitting(true);
      
      // First create a record in oauth_states to track this OAuth flow
      const { data: oauthStateData, error: oauthStateError } = await supabase
        .from("oauth_states")
        .insert({
          provider,
          agent_id: selectedAgentId,
          service_type: selectedIntegrationType,
          tenant_id: tenantId,
          config: configValues,
          status: "pending"
        })
        .select();
        
      if (oauthStateError) throw oauthStateError;
      
      // Store oauth state ID in session storage for the callback to use
      if (oauthStateData && oauthStateData.length > 0) {
        sessionStorage.setItem("oauth_state_id", oauthStateData[0].id);
        sessionStorage.setItem("integration_return_url", window.location.href);
        
        // Now redirect to the appropriate OAuth URL
        if (provider === "google") {
          // Google OAuth for Gmail
          const redirectUri = `${window.location.origin}/auth/callback`;
          const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`;
          window.location.href = googleAuthUrl;
        } else if (provider === "microsoft") {
          // Microsoft OAuth for Outlook
          // Import the utility for building the Azure OAuth URL
          const { buildAzureOAuthUrl } = await import("@/utils/oAuthAzure");
          // This will handle creating the proper PKCE code challenge and storing the code verifier
          const azureAuthUrl = await buildAzureOAuthUrl();
          window.location.href = azureAuthUrl;
        } else {
          toast.error(`Unsupported OAuth provider: ${provider}`);
        }
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      toast.error("Failed to start authentication flow");
      setIsSubmitting(false);
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

  const handleReusableCredentialSelect = (credentialId: string) => {
    setSelectedCredentialId(credentialId);
    // Skip to the last step since we already have credentials
    setStep(5);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const resetAndClose = () => {
    setStep(1);
    setSelectedAgentId("");
    setSelectedIntegrationType("");
    setConfigValues({});
    setSelectedCredentialId("");
    setIsCreatingAgent(false);
    setIsOAuthSuccess(false);
    // Clear session storage
    sessionStorage.removeItem("integration_wizard_state");
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
              {isCreatingAgent ? (
                <div className="space-y-4">
                  <FormBuilder
                    config={newAgentFormConfig}
                    onSubmit={handleCreateAgent}
                    isSubmitting={isSubmitting}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingAgent(false)}
                    className="w-full mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  {isLoadingAgents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        No agents found. Create an agent first.
                      </p>
                      <Button onClick={() => setIsCreatingAgent(true)}>
                        <Plus className="h-4 w-4 mr-2" />
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
                      
                      <div className="mt-4 flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreatingAgent(true)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Agent
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {!isCreatingAgent && (
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
            )}
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
                    selectedIntegrationType === integrationType.id
                      ? "border-primary bg-primary/5"
                      : ""
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
                    <CardTitle className="text-lg">
                      {integrationType.name}
                    </CardTitle>
                    <CardDescription>
                      {integrationType.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} disabled={!selectedIntegrationType}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

      case 3: {
        const selectedType = INTEGRATION_TYPES.find(
          (t) => t.id === selectedIntegrationType
        );
        const authType = selectedType?.authType || "custom";
        const formConfig = selectedType && INTEGRATION_FORM_CONFIGS[selectedIntegrationType];

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
              {isOAuthSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Authentication Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your account was successfully connected. You can continue to the next step.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Show reusable credentials dropdown if available */}
              {availableCredentialsByType.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">
                    Available Credentials
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have existing credentials you can reuse for this integration:
                  </p>
                  <Select
                    value={selectedCredentialId}
                    onValueChange={handleReusableCredentialSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select existing credentials" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCredentialsByType.map((cred) => (
                        <SelectItem key={cred.id} value={cred.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {cred.username} {cred.expires_at ? `(Expires: ${new Date(cred.expires_at).toLocaleDateString()})` : ''}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="border-t my-4"></div>
                  <h3 className="text-sm font-medium mb-2">
                    Or Create New Credentials
                  </h3>
                </div>
              )}

              {existingCredentials.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">
                    Use Existing Credentials
                  </h3>
                  <div className="space-y-3">
                    {existingCredentials.map((cred) => (
                      <Card
                        key={cred.id}
                        className={`cursor-pointer hover:border-primary transition-colors ${
                          selectedCredentialId === cred.id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() => handleCredentialSelect(cred.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cred.username}</p>
                              <p className="text-sm text-muted-foreground">
                                {cred.expires_at
                                  ? `Expires: ${new Date(
                                      cred.expires_at
                                    ).toLocaleDateString()}`
                                  : "Never expires"}
                              </p>
                              {cred.scopes && cred.scopes.length > 0 && (
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
                  <h3 className="text-sm font-medium mb-2">
                    Or Create New Credentials
                  </h3>
                </div>
              )}

              {authType === "oauth" ? (
                <div className="flex justify-center py-6">
                  {isOAuthSuccess ? (
                    <Button onClick={nextStep} className="gap-2" size="lg">
                      <ArrowRight className="h-4 w-4" />
                      Continue to Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        // Determine which OAuth provider to use based on the selected integration type
                        let provider = "google";
                        if (selectedIntegrationType === "outlook") {
                          provider = "microsoft";
                        }
                        
                        handleOAuthRedirect(provider);
                      }}
                      className="gap-2"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <LogIn className="h-5 w-5" />
                      )}
                      {formConfig?.submitButtonText ||
                        `Connect with ${selectedType?.name}`}
                    </Button>
                  )}
                </div>
              ) : (
                formConfig && (
                  <FormBuilder
                    config={formConfig}
                    onSubmit={handleFormSubmit}
                  />
                )
              )}
            </div>
            {authType !== "oauth" ? null : (
              <DialogFooter>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} disabled={isSubmitting}>
                  Skip <ArrowRight className="ml-2 h-4 w-4" />
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
                config={integrationSettingsConfig}
                onSubmit={handleFormSubmit}
                initialValues={{
                  name: configValues.name || selectedIntegrationType,
                  description: configValues.description || ""
                }}
              />
            </div>
          </>
        );

      case 5:
        const selectedType = INTEGRATION_TYPES.find(
          (t) => t.id === selectedIntegrationType
        );
        const selectedAgent = agents.find((a) => a.id === selectedAgentId);

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
                
                {isOAuthSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Authentication Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your account was successfully connected and credentials have been saved.
                    </AlertDescription>
                  </Alert>
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
