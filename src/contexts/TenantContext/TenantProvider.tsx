import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TenantContext } from "./TenantContext";
import { ROUTES } from "@/lib/constants";
import { Database } from "@/integrations/supabase/types";

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [tenantData, setTenantData] = useState<
    Database["public"]["Tables"]["tenants"]["Row"] | null
  >(null);
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [tenantOwnerId, setTenantOwnerId] = useState<string | null>(null);
  const [isTenantOwner, setIsTenantOwner] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAliasedTenant = useCallback(async () => {
    if (!urlTenantAlias) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("workspace", urlTenantAlias)
        .single();

      if (error) {
        toast.error("Unable to find tenant workspace");
        return;
      }

      return data;
    } catch (error) {
      console.error("Error in tenant lookup:", error);
    }
  }, [urlTenantAlias]);

  const checkTenantAccess = useCallback(
    async (id: string) => {
      if (tenantData) {
        return;
      }

      try {
        // Check if user has a pending request
        const { data: pendingRequest, error: pendingError } = await supabase
          .from("tenant_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", id)
          .eq("status", "pending")
          .single();

        return pendingRequest;
      } catch (error) {
        console.error("Error checking tenant access:", error);
      }
    },
    [user, tenantData]
  );

  const fetchUserTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_tenants", {
        user_id: user.id,
      });

      if (error) {
        console.error("Error fetching owner tenant:", error);
        return;
      }

      return data;
    } catch (error) {
      console.error("Error fetching primary tenant:", error);
    }
  }, [user]);

  const getCurrentTenant = useCallback(async () => {
    try {
      if (tenantData) return;

      setIsLoading(true);

      let tenant = null;

      const userTenants = await fetchUserTenants();

      const primaryTenant = userTenants.find((t) => t.is_primary_tenant);

      tenant = primaryTenant;

      if (urlTenantAlias) {
        tenant = await fetchAliasedTenant();
      }
      const isOwner = tenant?.tenant_owner_id === user.id;

      if (!isOwner) {
        const pendingRequest = await checkTenantAccess(tenant.id);

        if (pendingRequest) {
          setHasPendingRequest(true);
          setHasTenantAccess(false);
        }
      }

      if (tenant) {
        setTenantData(tenant);
        setHasTenantAccess(true);

        if (isOwner) {
          setTenantOwnerId(tenant.id);
          setIsTenantOwner(true);
        }
      }
    } catch (error) {
      console.error("Error fetching current tenant:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    tenantData,
    urlTenantAlias,
    fetchUserTenants,
    fetchAliasedTenant,
    user,
    checkTenantAccess,
  ]);

  useEffect(() => {
    if (!user) return;
    if (isLoading) return;

    getCurrentTenant();
  }, [getCurrentTenant, user, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;

    //  TODO: Handle tenant change
  }, [
    hasPendingRequest,
    hasTenantAccess,
    location.pathname,
    navigate,
    tenantData,
    urlTenantAlias,
    user,
    isLoading,
  ]);

  const contextValue = {
    tenantId: tenantData?.id,
    urlTenantAlias: urlTenantAlias || tenantData?.workspace,
    tenantData,
    isLoading,
    hasTenantAccess,
    hasPendingRequest,
    tenantOwnerId,
    hasTenantInUrl: !!urlTenantAlias,
    isTenantOwner,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
