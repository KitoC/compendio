import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { ICredential } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import clsx from "clsx";

const CredentialCard = ({ credentialId }: { credentialId: string }) => {
  const [credential, setCredential] = useState<ICredential | null>(null);
  // TODO: Show valid/refresh state
  const [isValid, setIsValid] = useState(true);

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

  return (
    <Card
      className={clsx("cursor-pointer transition-colors ", {
        "border-success bg-success/5 hover:border-success": isValid,
        "border-warning bg-warning/5 hover:border-warning": !isValid,
      })}
    >
      {credential && (
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{credential.name}</p>
              <p className="font-medium">{credential.username}</p>

              <p className="text-sm text-muted-foreground">
                {credential.expires_at
                  ? `Expires: ${new Date(
                      credential.expires_at
                    ).toLocaleDateString()}`
                  : "Never expires"}
              </p>
              {credential.scopes && credential.scopes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Scopes: {credential.scopes.join(", ")}
                </p>
              )}
            </div>
            {isValid && <ShieldCheck className="h-5 w-5 text-success" />}
            {!isValid && <ShieldAlert className="h-5 w-5 text-warning" />}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CredentialCard;
