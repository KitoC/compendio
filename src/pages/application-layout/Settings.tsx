// NO_CHANGE
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AuthRequired from "@/components/AuthRequired";
import PageLoading from "@/components/PageLoading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Page from "@/components/Page";
import { useTenant } from "@/contexts/TenantContext";

const Settings = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

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
      if (!user || !tenantId) return;

      try {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

        if (rolesError) throw rolesError;

        setUserRole(roles[0]?.role_type || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, tenantId]);

  if (isRoleLoading) {
    return <PageLoading />;
  }

  return <Outlet />;
};

export default Settings;
