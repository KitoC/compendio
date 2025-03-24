import { INTEGRATION_TYPES } from "@/lib/constants";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Globe,
  Mail,
  Workflow,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { StepProps } from "../types";
import clsx from "clsx";

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
const SelectIntegrationType = ({
  nextStep,
  prevStep,
  wizardState,
  onStepDataCapture,
}: StepProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Step 2: Select Integration Type</DialogTitle>
        <DialogDescription>
          Choose the type of service to connect
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_TYPES.map((integrationType) => {
          const isSelected =
            wizardState.selectedIntegrationType === integrationType.id;
          return (
            <Card
              key={integrationType.id}
              className={clsx(
                "cursor-pointer hover:border-info transition-colors",
                {
                  "border-info bg-info/5": isSelected,
                }
              )}
              onClick={() =>
                onStepDataCapture({
                  selectedIntegrationType: integrationType.id,
                })
              }
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="p-2 rounded-full bg-info/10">
                    {getIntegrationIcon(integrationType.icon)}
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-info" />}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">
                  {integrationType.name}
                </CardTitle>
                <CardDescription>{integrationType.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!wizardState.selectedIntegrationType}
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
};

export default SelectIntegrationType;
