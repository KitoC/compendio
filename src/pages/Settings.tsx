
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import PageLoading from "@/components/PageLoading";

const Settings = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  // Redirect to appearance settings by default
  useEffect(() => {
    if (window.location.pathname === ROUTES.SETTINGS) {
      navigate(ROUTES.SETTINGS_APPEARANCE, { replace: true });
    }
  }, [navigate]);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <AuthRequired>
      <div className="container mx-auto py-8 max-w-5xl flex flex-col h-full">
        <Card className="overflow-hidden flex flex-col flex-1">
          <div className="p-6 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </Card>
      </div>
    </AuthRequired>
  );
};

export default Settings;
