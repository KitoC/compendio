import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { INTEGRATION_FORM_CONFIGS } from "@/forms/integrations";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Loader2,
  User,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { buildGoogleOAuthUrl } from "@/utils/oAuth/oAuthGoogle";
import { ICredential, StepProps } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";
import CredentialCard from "./components/CredentialCard";

const Authentication = ({
  nextStep,
  prevStep,
  wizardState,
  onStepDataCapture,
}: StepProps) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { selectedIntegrationType, selectedCredentialId } = wizardState;

  const [existingCredentials, setExistingCredentials] = useState<ICredential[]>(
    []
  );
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [credentialName, setCredentialName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = INTEGRATION_TYPES.find(
    (t) => t.id === selectedIntegrationType
  );
  const authType = selectedType?.authType || "custom";
  const formConfig =
    selectedType && INTEGRATION_FORM_CONFIGS[selectedIntegrationType];

  const fetchCredentialsByType = useCallback(
    async (serviceType: string) => {
      if (!tenantId) return;

      console.log("fetching credentials by type --> ", serviceType);
      try {
        const { data, error } = await supabase
          .from("credentials")
          .select("id, name, username, domain, expires_at, scopes, type")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setExistingCredentials(data as ICredential[]);
        console.log("setting existing credentials --> ", data);
        setIsLoadingCredentials(false);
      } catch (error) {
        console.error("Error fetching reusable credentials:", error);
      }
    },
    [tenantId]
  );

  const handleOAuthRedirect = async (provider: string) => {
    if (!tenantId || !wizardState.selectedAgentId) return;

    try {
      setIsSubmitting(true);

      // Store oauth state ID in session storage for the callback to use
      sessionStorage.setItem("integration_return_url", window.location.href);
      sessionStorage.setItem("user_id", user.id);
      sessionStorage.setItem("agent_id", wizardState.selectedAgentId);
      sessionStorage.setItem("service_type", selectedIntegrationType);
      sessionStorage.setItem("tenant_id", tenantId);

      // Now redirect to the appropriate OAuth URL
      if (provider === "google") {
        // Google OAuth for Gmail
        const googleAuthUrl = await buildGoogleOAuthUrl();

        window.location.href = googleAuthUrl;
      } else if (provider === "microsoft") {
        // Microsoft OAuth for Outlook
        // Import the utility for building the Azure OAuth URL
        const { buildAzureOAuthUrl } = await import("@/utils/oAuth/oAuthAzure");
        // This will handle creating the proper PKCE code challenge and storing the code verifier
        const azureAuthUrl = await buildAzureOAuthUrl();
        window.location.href = azureAuthUrl;
      } else {
        toast.error(`Unsupported OAuth provider: ${provider}`);
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      toast.error("Failed to start authentication flow");
      setIsSubmitting(false);
    }
  };

  const handleCredentialSelect = (credentialId: string) => {
    onStepDataCapture({ selectedCredentialId: credentialId });
  };

  const handleFormSubmit = (values: Record<string, unknown>) => {
    // TODO: Handle other types of auth.
  };

  useEffect(() => {
    if (selectedIntegrationType && !existingCredentials.length) {
      fetchCredentialsByType(selectedIntegrationType);
    }
  }, [selectedIntegrationType, fetchCredentialsByType, existingCredentials]);

  useEffect(() => {
    const credentialId = sessionStorage.getItem("credential_id");
    const oauthStateId = sessionStorage.getItem("oauth_state_id");

    if (credentialId && oauthStateId && !wizardState.selectedCredentialId) {
      onStepDataCapture({ selectedCredentialId: credentialId });
    }
  }, [onStepDataCapture, wizardState.selectedCredentialId]);

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
            <h3 className="text-sm font-medium mb-2">Available Credentials</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You have existing credentials you can reuse for this integration:
            </p>
            <div className="space-y-3">
              <Select
                value={wizardState.selectedCredentialId}
                onValueChange={handleCredentialSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select existing credentials" />
                </SelectTrigger>
                <SelectContent>
                  {existingCredentials.map((cred) => (
                    <SelectItem key={cred.id} value={cred.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {cred.username}
                        {cred.name}
                        {cred.expires_at
                          ? ` (Expires: ${new Date(
                              cred.expires_at
                            ).toLocaleDateString()})`
                          : ""}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* TODO: Do an auth check/refresh when selecting a credential and have a feedback message if the credential is expired. */}
              {selectedCredentialId && (
                <CredentialCard credentialId={selectedCredentialId} />
              )}
            </div>
            <div className="border-t my-4"></div>
            <h3 className="text-sm font-medium mb-2">
              Or Create New Credentials
            </h3>
          </div>
        )}

        {authType === "oauth" ? (
          // TODO: move create new credential into select option.
          <div className="flex justify-center py-6">
            <div className="flex flex-row justify-center items-end gap-2 w-3/4">
              <div className="flex flex-col gap-2 flex-grow">
                <Label htmlFor="name">Credential Name</Label>
                <Input
                  placeholder="Enter a name for your credentials"
                  className="w-full"
                  value={credentialName}
                  onChange={(e) => {
                    setCredentialName(e.target.value);
                  }}
                />
              </div>
              <Button
                onClick={() => {
                  // Determine which OAuth provider to use based on the selected integration type
                  let provider = "google";
                  if (selectedIntegrationType === "outlook") {
                    provider = "microsoft";
                  }

                  sessionStorage.setItem("credential_name", credentialName);
                  handleOAuthRedirect(provider);
                }}
                className="gap-2 basis-1/4"
                size="lg"
                disabled={isSubmitting || !credentialName}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {formConfig?.submitButtonText ||
                  `Connect with ${selectedType?.name}`}
              </Button>
            </div>
          </div>
        ) : (
          // TODO: Support other types of auth.
          formConfig && (
            <FormBuilder config={formConfig} onSubmit={handleFormSubmit} />
          )
        )}
      </div>

      {authType !== "oauth" ? null : (
        <DialogFooter>
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={isSubmitting || !wizardState.selectedCredentialId}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      )}
    </>
  );
};

export default Authentication;
