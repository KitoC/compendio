import { INTEGRATION_TYPES } from "@/consts/routes";

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

import { Globe, Mail, Workflow, Check } from "lucide-react";
import { StepProps } from "../types";
import clsx from "clsx";
import { SiAirtable, SiGmail, SiGoogledrive } from "react-icons/si";
import { PiMicrosoftOutlookLogoFill } from "react-icons/pi";

const getIntegrationIcon = (type: string) => {
  switch (type) {
    case "mail":
      return <Mail className="h-6 w-6" />;
    case "workflow":
      return <Workflow className="h-6 w-6" />;
    case "gmail":
      return <SiGmail className="h-6 w-6" />;
    case "google-drive":
      return <SiGoogledrive className="h-6 w-6" />;
    case "outlook":
      return <PiMicrosoftOutlookLogoFill className="h-6 w-6" />;
    case "airtable":
      return <SiAirtable className="h-6 w-6" />;
    default:
      return <Globe className="h-6 w-6" />;
  }
};
const SelectIntegrationType = ({
  nextStep,
  prevStep,
  wizardState,
  onStepDataCapture,
  resetAndClose,
}: StepProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Select Integration Type</DialogTitle>
        <DialogDescription>
          Choose the type of service to connect
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_TYPES.map((integrationType) => {
          const isSelected = wizardState.service_type === integrationType.id;
          return (
            <Card
              key={integrationType.id}
              className={clsx(
                "cursor-pointer hover:border-info transition-colors p-0",
                {
                  "border-info bg-info/5": isSelected,
                }
              )}
              onClick={() =>
                onStepDataCapture({
                  service_type: integrationType.id,
                })
              }
            >
              <CardHeader className="pb-2 p-4">
                <div className="flex gap-2 items-center">
                  <div className="p-2 rounded-full bg-info/10">
                    {getIntegrationIcon(integrationType.icon)}
                  </div>
                  <CardTitle className="text-lg">
                    {integrationType.name}
                  </CardTitle>
                  {isSelected && (
                    <Check className="ml-auto h-5 w-5 text-info" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardDescription>{integrationType.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={resetAndClose}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
};

export default SelectIntegrationType;
