
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { ROUTES } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

const AccessPending = () => {
  const { signOut } = useAuth();
  const { urlTenantAlias, tenantData } = useTenant();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Access Pending</CardTitle>
          <CardDescription className="text-center">
            Your access request for {tenantData?.name || urlTenantAlias} is pending approval
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p>
            An administrator needs to approve your request before you can access this workspace.
            You will be notified by email when your request is approved.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleRefresh} className="w-full">
            Refresh Status
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccessPending;
