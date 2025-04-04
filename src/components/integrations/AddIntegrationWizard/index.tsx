import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useTenant } from "@/contexts/TenantContext";

import AddAiAgent from "./steps/AddAiAgent";
import { useCallback } from "react";
import type { WizardState } from "./types";
import { AddIntegrationWizardProps } from "./types";
import SelectIntegrationType from "./steps/SelectIntegrationType";
import Authentication, {
  OAUTH_INTEGRATION_CALLBACK_DATA_KEY,
} from "./steps/Authentication";
import CustomIntegrationSettings from "./steps/CustomIntegrationSettings";
import ConfirmIntegrationSettings from "./steps/ConfirmIntegrationSettings";
import {
  clearIntegrationWizardState,
  getIntegrationWizardState,
  initialWizardState,
  setIntegrationWizardState,
} from "./utils";

const AddIntegrationWizard = ({
  isOpen,
  onClose,
}: AddIntegrationWizardProps) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const [wizardState, setWizardState] = useState<WizardState>(
    getIntegrationWizardState({
      ...initialWizardState,
      user_id: user?.id,
      tenant_id: tenantId,
    })
  );

  // Save wizard state whenever key fields change
  useEffect(() => {
    if (isOpen) {
      setIntegrationWizardState(wizardState);
    }
  }, [isOpen, wizardState]);

  const nextStep = () => {
    setWizardState({ ...wizardState, step: wizardState.step + 1 });
  };
  const prevStep = () => {
    setWizardState({ ...wizardState, step: wizardState.step - 1 });
  };

  const resetAndClose = () => {
    clearIntegrationWizardState();
    sessionStorage.removeItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY);

    onClose();
  };

  const onStepDataCapture = useCallback(
    (data: Partial<WizardState>) => {
      const nextWizardState = { ...wizardState, ...data };

      setIntegrationWizardState(nextWizardState);

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
