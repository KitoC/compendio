import FormBuilder from "@/components/form-builder";
import { DialogDescription } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { integrationSettingsConfig } from "@/forms/integrations";
import { StepProps } from "../types";
import { useCallback } from "react";

const CustomIntegrationSettings = ({
  nextStep,
  prevStep,
  wizardState,
  onStepDataCapture,
}: StepProps) => {
  const handleFormSubmit = useCallback(
    (configValues: Record<string, unknown>) => {
      onStepDataCapture({
        configValues: {
          ...wizardState.configValues,
          ...configValues,
        },
      });
      nextStep();
    },
    [onStepDataCapture, nextStep, wizardState.configValues]
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Optional Settings</DialogTitle>
        <DialogDescription>
          Customize your integration (optional)
        </DialogDescription>
      </DialogHeader>
      <div className="">
        <FormBuilder
          footerClassname="border-none p-0"
          className="border-none p-0 bg-transparent shadow-none"
          config={integrationSettingsConfig}
          onSubmit={handleFormSubmit}
          onCancel={prevStep}
          initialValues={{
            name: wizardState.configValues.name || "",
            description: wizardState.configValues.description || "",
          }}
        />
      </div>
    </>
  );
};

export default CustomIntegrationSettings;
