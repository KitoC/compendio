import { useEffect, useState } from "react";
import { INTEGRATION_TYPES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import { INTEGRATION_FORM_CONFIGS } from "@/forms/integrations";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ArrowLeft, ArrowRight, LogIn } from "lucide-react";

import { StepProps } from "../types";

import CreateOauthCredential from "./components/CreateOauthCredential";
import ExistingCredentialSelector from "./components/ExistingCredentialSelector";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";
import { hasValidationError } from "../utils";
import { useCredentialsQuery } from "../queries/useCredentialsQuery";

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
  const { service_type, credential_id } = wizardState;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNewCredential, setIsCreatingNewCredential] = useState(false);

  const selectedType = INTEGRATION_TYPES.find((t) => t.id === service_type);
  const authType = selectedType?.authType || "custom";
  const formConfig = selectedType && INTEGRATION_FORM_CONFIGS[service_type];

  const provider = selectedType?.oauthProvider || "google";

  const { data: existingCredentials } = useCredentialsQuery({
    service_type,
    authType,
    provider,
    tenantId,
  });

  const handleCredentialSelect = (credential_id: string) => {
    onStepDataCapture({ credential_id });
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    // TODO: Handle other types of auth.
    const result = await callSupabaseFunction("create-credential", {
      access_token: values.access_token,
      provider: service_type,
      user_id: user.id,
      tenant_id: tenantId,
      credential_name: values.name,
    });

    const { credential: credential_id } = await result.json();

    onStepDataCapture({ credential_id });

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (existingCredentials.length && !credential_id) {
      onStepDataCapture({ credential_id: existingCredentials[0].id });
    }
  }, [existingCredentials, credential_id, onStepDataCapture]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configure Authentication</DialogTitle>
        <DialogDescription>
          {authType === "oauth"
            ? "Authenticate with your account"
            : "Enter your connection credentials"}
        </DialogDescription>
      </DialogHeader>

      <ExistingCredentialSelector
        wizardState={wizardState}
        handleCredentialSelect={handleCredentialSelect}
        isCreatingNewCredential={isCreatingNewCredential}
        existingCredentials={existingCredentials}
      />

      <div>
        {authType === "oauth" ? (
          <CreateOauthCredential
            authType={selectedType}
            wizardState={wizardState}
            onStepDataCapture={onStepDataCapture}
            isCreatingNewCredential={isCreatingNewCredential}
            setIsCreatingNewCredential={setIsCreatingNewCredential}
          />
        ) : (
          <>
            {isCreatingNewCredential ? (
              <FormBuilder
                footerClassname="border-none p-2"
                className="border-none p-0"
                config={formConfig}
                onSubmit={handleFormSubmit}
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
        )}
      </div>

      {isCreatingNewCredential ? null : (
        <DialogFooter>
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              isSubmitting ||
              !credential_id ||
              !!hasValidationError(
                selectedType,
                existingCredentials?.find((c) => c.id === credential_id)
              )
            }
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      )}
    </>
  );
};

export default Authentication;
