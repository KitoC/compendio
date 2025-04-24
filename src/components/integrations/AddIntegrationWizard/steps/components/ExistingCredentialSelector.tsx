import { SelectItem } from "@/components/ui/select";

import {
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Select } from "@/components/ui/select";
import CredentialCard from "./CredentialCard";
import { ICredential, WizardState } from "../../types";
import { INTEGRATION_TYPES } from "@/lib/constants";
import { User } from "lucide-react";
import { hasValidationError } from "../../utils";

interface ExistingCredentialSelectorProps {
  wizardState: WizardState;
  handleCredentialSelect: (credential_id: string) => void;
  isCreatingNewCredential: boolean;
  existingCredentials: ICredential[];
}

const ExistingCredentialSelector = ({
  wizardState,
  handleCredentialSelect,
  isCreatingNewCredential,
  existingCredentials = [],
}: ExistingCredentialSelectorProps) => {
  const { service_type, credential_id } = wizardState;

  const selectedType = INTEGRATION_TYPES.find((t) => t.id === service_type);

  if (isCreatingNewCredential) {
    return <div className="py-4"></div>;
  }

  return (
    <div className={`${isCreatingNewCredential ? "py-0" : "py-4"}`}>
      {existingCredentials.length > 0 && !isCreatingNewCredential && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Available Credentials</h3>
          <p className="text-sm text-muted-foreground mb-3">
            You have existing credentials you can reuse for this integration:
          </p>
          <div className="space-y-3">
            <Select
              value={wizardState.credential_id}
              onValueChange={handleCredentialSelect}
            >
              <SelectTrigger className="w-full bg-sidebar">
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

                        {cred.associated_email && (
                          <span className="text-xs text-muted-foreground">
                            ({cred.associated_email})
                          </span>
                        )}
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
            {credential_id && (
              <CredentialCard
                credentialId={credential_id}
                hasValidationError={hasValidationError(
                  selectedType,
                  existingCredentials.find((c) => c.id === credential_id)
                )}
              />
            )}
            <div className="border-t my-4"></div>
            <h3 className="text-sm font-medium mb-2">
              Or Create New Credentials
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingCredentialSelector;
