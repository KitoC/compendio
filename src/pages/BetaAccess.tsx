import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { ROUTES } from "@/consts/routes";
import { Input } from "@/components/ui/input";

const BetaAccess = () => {
  const { user } = useAuth();
  const { createNewTenant, error, setError, isCreatingTenant } = useTenant();
  const [tenantName, setTenantName] = useState("");

  const tenantWorkspace = tenantName.toLowerCase().replace(/ /g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Missing user information");
      return;
    }

    createNewTenant(tenantName);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            This app is still in beta
          </CardTitle>

          <CardDescription className="text-center">
            Enter a name for your workspace and we will create it for you.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              value={tenantName}
              onChange={(e) => {
                setTenantName(e.target.value);
                setError(null);
              }}
              placeholder="Enter your workspace name"
            />
            {error && <p className="text-red-500">{error.message}</p>}
          </CardContent>
          <CardFooter>
            <div className="flex flex-col items-center gap-3 w-full">
              <Button
                type="submit"
                className="w-full"
                disabled={isCreatingTenant}
              >
                {isCreatingTenant ? "Submitting..." : "Request beta access"}
              </Button>
              {error && (error as { code: string }).code === "23505" && (
                <NavLink
                  to={ROUTES.REQUEST_ACCESS?.replace(
                    ":tenantId",
                    tenantWorkspace
                  )}
                  className={"text-primary underline"}
                >
                  Request access to{" "}
                  <span className="font-bold">{tenantName}</span>
                </NavLink>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default BetaAccess;
