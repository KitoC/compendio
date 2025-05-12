import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES, ROUTES } from "@/consts/routes";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { StepProps } from "../types";

import CredentialCard from "./components/CredentialCard";
import AiAgentCard from "./components/AiAgentCard";

const ConfirmIntegrationSettings = ({
  prevStep,
  wizardState,
  onClose,
}: StepProps) => {
  const { agent_id, service_type, credential_id, configValues } = wizardState;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const selectedType = useMemo(
    () => INTEGRATION_TYPES.find((t) => t.id === service_type),
    [service_type]
  );

  const handleCreateIntegration = async () => {
    if (!tenantId || !agent_id || !service_type) return;

    try {
      setIsSubmitting(true);

      const integrationConfig = {
        service_type: service_type,
        name: (configValues.name as string) || service_type,
        status: "active",
        agent_id: agent_id,
        tenant_id: tenantId,
        config: configValues,
        credential_id: credential_id,
        // TODO: Make this dynamic
        webhook_change_type: selectedType?.webhookChangeType,
        webhook_resource: selectedType?.webhookResource,
      };

      const { data, error } = await supabase
        .from("connected_services")
        .insert([integrationConfig])
        .select();

      if (error) throw error;

      toast.success("Integration created successfully");
      onClose();

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

  return (
    <>
      <DialogHeader>
        <DialogTitle>Step 5: Review and Save</DialogTitle>
        <DialogDescription>Confirm your integration details</DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium font-bold text-muted-foreground">
                Service Type
              </h3>
              <p>{selectedType?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium font-bold text-muted-foreground">
                Name
              </h3>
              <p>{configValues.name || selectedType?.name}</p>
            </div>

            <div className="gap-2">
              <h3 className="text-sm font-medium font-bold text-muted-foreground">
                Description
              </h3>
              <p>{configValues.description || selectedType?.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium font-bold text-muted-foreground">
                Authentication
              </h3>
              {credential_id && <CredentialCard credentialId={credential_id} />}
            </div>
            {agent_id && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium font-bold text-muted-foreground">
                  Agent
                </h3>
                <AiAgentCard id={agent_id} />
              </div>
            )}
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
};

export default ConfirmIntegrationSettings;
