import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTEGRATION_TYPES, ROUTES } from "@/lib/constants";
import FormBuilder from "@/components/form-builder";
import {
  integrationSettingsConfig,
  INTEGRATION_FORM_CONFIGS,
} from "@/forms/integrations";
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
import { useTenant } from "@/contexts/TenantContext";
import { Json } from "@/integrations/supabase/types";

import AddAiAgent from "./steps/AddAiAgent";
import { useCallback } from "react";
import type { WizardState, Credential } from "./types";
import { AddIntegrationWizardProps } from "./types";
import SelectIntegrationType from "./steps/SelectIntegrationType";
import Authentication from "./steps/Authentication";
import CustomIntegrationSettings from "./steps/CustomIntegrationSettings";
import ConfirmIntegrationSettings from "./steps/ConfirmIntegrationSettings";

const initialWizardState: WizardState = {
  step: 1,
  selectedAgentId: "",
  selectedIntegrationType: "",
  selectedCredentialId: "",
  configValues: {
    name: "",
    description: "",
    icon: "",
    url: "",
    authType: "",
    scopes: [],
  },
};

const AddIntegrationWizard = ({
  isOpen,
  onClose,
}: AddIntegrationWizardProps) => {
  const [wizardState, setWizardState] = useState<WizardState>(
    sessionStorage.getItem("integration_wizard_state")
      ? JSON.parse(sessionStorage.getItem("integration_wizard_state") || "")
      : initialWizardState
  );

  // Save wizard state whenever key fields change
  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem(
        "integration_wizard_state",
        JSON.stringify(wizardState)
      );
    }
  }, [isOpen, wizardState]);

  const nextStep = () => {
    setWizardState({ ...wizardState, step: wizardState.step + 1 });
  };
  const prevStep = () => {
    setWizardState({ ...wizardState, step: wizardState.step - 1 });
  };

  const resetAndClose = () => {
    setWizardState(initialWizardState);

    sessionStorage.removeItem("integration_wizard_state");
    onClose();
  };

  const onStepDataCapture = useCallback(
    (data: Partial<WizardState>) => {
      const nextWizardState = { ...wizardState, ...data };

      sessionStorage.setItem(
        "integration_wizard_state",
        JSON.stringify(nextWizardState)
      );

      setWizardState(nextWizardState);
    },
    [wizardState]
  );

  const renderStepContent = () => {
    switch (wizardState.step) {
      case 1:
        return (
          <AddAiAgent
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
          />
        );

      case 2:
        return (
          <SelectIntegrationType
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
          />
        );

      case 3: {
        return (
          <Authentication
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
          />
        );
      }

      case 4:
        return (
          <CustomIntegrationSettings
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
          />
        );

      case 5:
        return (
          <ConfirmIntegrationSettings
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
            onClose={onClose}
          />
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
              Step {wizardState.step} of 5
            </div>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all rounded-full"
              style={{ width: `${(wizardState.step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AddIntegrationWizard;
