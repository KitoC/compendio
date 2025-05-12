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
import { INTEGRATION_TYPES } from "@/consts/routes";

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

  const integrationType = INTEGRATION_TYPES.find(
    (type) => type.id === wizardState.service_type
  );

  // Save wizard state whenever key fields change
  useEffect(() => {
    if (isOpen) {
      setIntegrationWizardState(wizardState);
    }
  }, [isOpen, wizardState]);

  const nextStep = useCallback(() => {
    setWizardState({ ...wizardState, step: wizardState.step + 1 });
  }, [wizardState]);
  const prevStep = useCallback(() => {
    setWizardState({ ...wizardState, step: wizardState.step - 1 });
  }, [wizardState]);

  const resetAndClose = () => {
    clearIntegrationWizardState();
    sessionStorage.removeItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY);

    setWizardState(
      getIntegrationWizardState({
        ...initialWizardState,
        user_id: user?.id,
        tenant_id: tenantId,
      })
    );
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

  const onPrevStep = useCallback(() => {
    if (wizardState.step === 1) {
      setWizardState({
        ...initialWizardState,
        user_id: user?.id,
        tenant_id: tenantId,
      });
    } else {
      prevStep();
    }
  }, [wizardState.step, user?.id, tenantId, prevStep]);

  const defaultSteps = [
    AddAiAgent,
    Authentication,
    CustomIntegrationSettings,
    ConfirmIntegrationSettings,
  ];

  const steps = integrationType?.steps || defaultSteps;

  const StepComponent = steps[wizardState.step - 1];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {!wizardState.service_type ? (
          <SelectIntegrationType
            nextStep={nextStep}
            prevStep={prevStep}
            resetAndClose={resetAndClose}
            onStepDataCapture={onStepDataCapture}
            wizardState={wizardState}
          />
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Add {integrationType?.name} Integration
                </h2>
                <div className="text-sm text-muted-foreground">
                  Step {wizardState.step} of {steps.length}
                </div>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all rounded-full"
                  style={{
                    width: `${(wizardState.step / steps.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <StepComponent
              nextStep={nextStep}
              prevStep={onPrevStep}
              resetAndClose={resetAndClose}
              onStepDataCapture={onStepDataCapture}
              wizardState={wizardState}
              onClose={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddIntegrationWizard;
