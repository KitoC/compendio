import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES, ROUTES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { INTEGRATION_FORM_CONFIGS } from "@/forms/integrations";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import CredentialCard from "./components/CredentialCard";
import { useLocation } from "react-router-dom";
import { getUrlParameter } from "@/utils/oAuth/shared";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";

export const OAUTH_INTEGRATION_CALLBACK_DATA_KEY =
  "oauth_integration_callback_data";

const Authentication = ({
  nextStep,
  prevStep,
  wizardState,
  onStepDataCapture,
}: StepProps) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const location = useLocation();
  const { selectedIntegrationType, selectedCredentialId } = wizardState;

  const [existingCredentials, setExistingCredentials] = useState<ICredential[]>(
    []
  );
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [isCreatingNewCredential, setIsCreatingNewCredential] = useState(false);

  const selectedType = INTEGRATION_TYPES.find(
    (t) => t.id === selectedIntegrationType
  );
  const authType = selectedType?.authType || "custom";
  const provider = selectedType?.oauthProvider || "google";
  const formConfig =
    selectedType && INTEGRATION_FORM_CONFIGS[selectedIntegrationType];
  const fetchCredentialsByType = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("id, name, username, domain, created_at, scopes, type")
        .eq("tenant_id", tenantId)
        .eq("type", authType)
        .eq("provider", provider)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExistingCredentials(data as ICredential[]);

      setIsLoadingCredentials(false);
    } catch (error) {
      console.error("Error fetching reusable credentials:", error);
    }
  }, [tenantId, authType, provider]);

  const handleIntegrationCallback = useCallback(async () => {
    if (!user || !tenantId) {
      return;
    }

    const code = getUrlParameter("code");
    const state = getUrlParameter("state");

    const { credentialName, credentialId } = JSON.parse(
      sessionStorage.getItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY) || "{}"
    );

    try {
      if (!code || !state) {
        toast.error("Invalid OAuth callback");
        return;
      }

      const response = await callSupabaseFunction("handle_oauth_callback", {
        code,
        state,
        options: {
          credential_name: credentialName,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "OAuth callback failed");
        console.error("OAuth error:", result);
        return;
      }

      // Optionally store credential ID for later use
      if (result.credential_id) {
        onStepDataCapture({ selectedCredentialId: result.credential_id });
        fetchCredentialsByType();
      }
      sessionStorage.removeItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY);

      toast.success("Integration connected successfully");
    } catch (error) {
      console.error("OAuth callback exception:", error);
      toast.error("Failed to connect integration");
    }
  }, [user, tenantId, onStepDataCapture, fetchCredentialsByType]);

  const handleOAuthRedirect = async (formValues: Record<string, unknown>) => {
    const scopes = Object.entries(formValues)
      .filter(([key, value]) => key.includes("scope"))
      .map(([key, value]) => value);

    if (!tenantId || !wizardState.selectedAgentId) return;

    try {
      setIsSubmitting(true);

      const oauthCallbackData = {
        returnUrl: location.pathname,
        credentialName: formValues.name,
        agentId: wizardState.selectedAgentId,
        serviceType: selectedIntegrationType,
        tenantId,
        userId: user.id,
        credentialId: wizardState.selectedCredentialId,
      };

      // Store oauth state ID in session storage for the callback to use
      sessionStorage.setItem(
        OAUTH_INTEGRATION_CALLBACK_DATA_KEY,
        JSON.stringify(oauthCallbackData)
      );

      // Now redirect to the appropriate OAuth URL
      if (provider === "google") {
        // Google OAuth for Gmail
        const googleAuthUrl = await buildGoogleOAuthUrl();

        window.location.href = googleAuthUrl;
      } else if (provider === "azure") {
        // Microsoft OAuth for Outlook
        // Import the utility for building the Azure OAuth URL
        const { buildAzureOAuthUrl } = await import("@/utils/oAuth/oAuthAzure");
        // This will handle creating the proper PKCE code challenge and storing the code verifier
        const azureAuthUrl = await buildAzureOAuthUrl({
          scope: `openid profile email offline_access ${scopes.join(" ")}`,
        });

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
    if (selectedIntegrationType && !initialLoad) {
      setInitialLoad(true);
      fetchCredentialsByType();
    }
  }, [selectedIntegrationType, fetchCredentialsByType, initialLoad]);

  useEffect(() => {
    if (sessionStorage.getItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY)) {
      handleIntegrationCallback();
    }
  }, [handleIntegrationCallback]);

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

      <div className={`${isCreatingNewCredential ? "py-0" : "py-4"}`}>
        {existingCredentials.length > 0 && !isCreatingNewCredential && (
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
                  {existingCredentials.map((cred) => {
                    return (
                      <SelectItem key={cred.id} value={cred.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {cred.username}
                          {cred.name}
                          <span className="text-xs text-muted-foreground">
                            (created on{" "}
                            {new Date(cred.created_at).toLocaleDateString()})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {/* TODO: Do an auth check/refresh when selecting a credential and have a feedback message if the credential is expired. */}
              {selectedCredentialId && (
                <CredentialCard
                  credentialId={selectedCredentialId}
                  onRefresh={handleOAuthRedirect}
                />
              )}
            </div>
            <div className="border-t my-4"></div>
            <h3 className="text-sm font-medium mb-2">
              Or Create New Credentials
            </h3>
          </div>
        )}

        {authType === "oauth" ? (
          <>
            {isCreatingNewCredential ? (
              <FormBuilder
                footerClassname="border-none p-0"
                className="border-none p-0"
                config={formConfig}
                onSubmit={handleOAuthRedirect}
                onCancel={() => setIsCreatingNewCredential(false)}
                initialValues={formConfig.initialValues}
              />
            ) : (
              <div className="flex justify-center py-6">
                <div className="flex flex-row justify-center items-end gap-2 w-3/4">
                  <Button
                    onClick={() => setIsCreatingNewCredential(true)}
                    className="gap-2 basis-1/4"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    <LogIn className="h-5 w-5" />
                    {`Create new ${selectedType?.name} integration`}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          // TODO: Support other types of auth.
          formConfig && (
            <FormBuilder config={formConfig} onSubmit={handleFormSubmit} />
          )
        )}
      </div>

      {authType !== "oauth" || isCreatingNewCredential ? null : (
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
