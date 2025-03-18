
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AuthRequired } from "@/components/AuthRequired";
import PageLoading from "@/components/PageLoading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Settings = () => {
  const { user, isLoading, hasTenant, tenantId } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const location = useLocation();

  // Dispatch custom event to show settings sidebar
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("show-settings-sidebar"));

    // Cleanup: Restore original sidebar when component unmounts
    return () => {
      document.dispatchEvent(new CustomEvent("restore-original-sidebar"));
    };
  }, []);

  // Fetch user role from Supabase
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !hasTenant) return;

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role_type")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (error) throw error;
        setUserRole(data?.role_type || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, hasTenant, tenantId]);

  if (isLoading || isRoleLoading) {
    return <PageLoading />;
  }

  return (
    <AuthRequired>
      <div className="container mx-auto py-8 max-w-5xl flex flex-col h-full">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden"
            onClick={() => document.dispatchEvent(new CustomEvent("toggle-sidebar"))}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to main navigation</span>
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

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
