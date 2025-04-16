import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { INTEGRATION_FORM_CONFIGS } from "@/forms/integrations";
import { Button } from "@/components/ui/button";

import { LogIn, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { buildGoogleOAuthUrl } from "@/utils/oAuth/oAuthGoogle";
import { IntegrationType, WizardState } from "../../types";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { getUrlParameter } from "@/utils/oAuth/shared";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";

export const OAUTH_INTEGRATION_CALLBACK_DATA_KEY =
  "oauth_integration_callback_data";

interface CreateOauthCredentialProps {
  authType: IntegrationType;
  wizardState: WizardState;
  onStepDataCapture: (data: Partial<WizardState>) => void;
  isCreatingNewCredential: boolean;
  setIsCreatingNewCredential: (isCreatingNewCredential: boolean) => void;
}

const CreateOauthCredential = ({
  authType,
  wizardState,
  onStepDataCapture,
  isCreatingNewCredential,
  setIsCreatingNewCredential,
}: CreateOauthCredentialProps) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const location = useLocation();
  const { service_type, credential_id } = wizardState;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const provider = authType?.oauthProvider || "google";
  const formConfig =
    authType &&
    (INTEGRATION_FORM_CONFIGS[provider] ||
      INTEGRATION_FORM_CONFIGS[service_type]);

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
          credential_id: credentialId,
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
        onStepDataCapture({ credential_id: result.credential_id });
      }
      sessionStorage.removeItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY);

      toast.success("Integration connected successfully");
    } catch (error) {
      console.error("OAuth callback exception:", error);
      toast.error("Failed to connect integration");
    }
  }, [user, tenantId, onStepDataCapture]);

  const handleOAuthRedirect = async (formValues: Record<string, unknown>) => {
    const scopes = Object.entries(formValues)
      .filter(([key, value]) => key.includes("scope"))
      .map(([key, value]) => value);

    if (!tenantId || !wizardState.agent_id) return;

    try {
      setIsSubmitting(true);

      const oauthCallbackData = {
        returnUrl: location.pathname,
        credentialName: formValues.name,
        agentId: wizardState.agent_id,
        serviceType: service_type,
        tenantId,
        userId: user.id,
        credentialId: credential_id,
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
        const scope = `openid profile email offline_access User.Read ${scopes.join(
          " "
        )}`;
        // This will handle creating the proper PKCE code challenge and storing the code verifier
        const azureAuthUrl = await buildAzureOAuthUrl({
          scope,
          prompt: "select_account",
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

  useEffect(() => {
    if (sessionStorage.getItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY)) {
      handleIntegrationCallback();
    }
  }, [handleIntegrationCallback]);

  return (
    <>
      {isCreatingNewCredential ? (
        <FormBuilder
          footerClassname="border-none p-6"
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
              {`Create new ${authType?.name} integration`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateOauthCredential;
