import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import { ICredential } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import clsx from "clsx";
import { Button } from "@/components/ui/button";

const CredentialCard = ({
  credentialId,
  onRefresh,
  hasValidationError,
}: {
  credentialId: string;
  onRefresh?: (credential: ICredential) => void;
  hasValidationError?: string | boolean;
}) => {
  const [credential, setCredential] = useState<ICredential | null>(null);
  // TODO: Show valid/refresh state

  const getSelectedCredential = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("id", credentialId)
        .single();

      setCredential(data);
    } catch (e) {
      toast.error("Error fetching credential:", e);
    }
  }, [credentialId]);

  useEffect(() => {
    getSelectedCredential();
  }, [getSelectedCredential]);

  const refreshFailed = credential?.refresh_failed;

  return (
    <Card
      className={clsx("cursor-pointer transition-colors ", {
        "border-success bg-success/5 hover:border-success": !refreshFailed,
        "border-warning bg-warning/5 hover:border-warning":
          refreshFailed || hasValidationError,
      })}
    >
      {credential && (
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {credential.name}
                {credential.associated_email && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({credential.associated_email})
                  </span>
                )}
              </p>
              <p className="font-medium">{credential.username}</p>

              {credential.scopes && credential.scopes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Permissions:{" "}
                  {credential.scopes
                    .filter((scope) => scope.includes("."))
                    .join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Created: {new Date(credential.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                {hasValidationError && (
                  <p className="text-sm font-bold text-warning">
                    {hasValidationError}
                  </p>
                )}
                {/* TODO: Add refresh button back in */}
                {!refreshFailed && !hasValidationError && (
                  <ShieldCheck className="h-5 w-5 text-success" />
                )}
                {!refreshFailed && hasValidationError && (
                  <ShieldAlert className="h-5 w-5 text-warning" />
                )}
              </div>
              {hasValidationError && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => onRefresh(credential)}
                >
                  Reauthenticate
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CredentialCard;
