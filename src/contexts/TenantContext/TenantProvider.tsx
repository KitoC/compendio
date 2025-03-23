import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TenantContext } from "./TenantContext";

type TenantData = {
  id: string;
  workspace: string;
  name: string;
  tenant_owner_id: string;
  [key: string]: any;
};

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!urlTenantAlias);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [tenantOwnerId, setTenantOwnerId] = useState<string | null>(null);
  const [isTenantOwner, setIsTenantOwner] = useState<boolean>(false);

  // Fetch tenant data from the workspace alias
  useEffect(() => {
    const fetchTenantIdFromAlias = async () => {
      if (!urlTenantAlias) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("*")
          .eq("workspace", urlTenantAlias)
          .single();

        if (error) {
          console.error("Error fetching tenant:", error);
          toast.error("Unable to find tenant workspace");
          setIsLoading(false);
          return;
        }

        if (data) {
          setTenantId(data.id);
          setTenantData(data);
          setTenantOwnerId(data.tenant_owner_id);
        }
      } catch (error) {
        console.error("Error in tenant lookup:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantIdFromAlias();
  }, [urlTenantAlias]);

  // Check user's access to this tenant
  useEffect(() => {
    const checkTenantAccess = async () => {
      if (tenantData) {
        return;
      }
      if (!user || !tenantId) {
        setHasTenantAccess(false);
        setHasPendingRequest(false);
        setIsTenantOwner(false);
        return;
      }

      try {
        // Check if user is the tenant owner
        if (user.id === tenantOwnerId) {
          setHasTenantAccess(true);
          setHasPendingRequest(false);
          setIsTenantOwner(true);
          return;
        }

        // Check if user has a pending request
        const { data: pendingRequest, error: pendingError } = await supabase
          .from("tenant_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .eq("status", "pending")
          .single();

        if (pendingError && pendingError.code !== "PGRST116") {
          throw pendingError;
        }

        if (pendingRequest) {
          setHasTenantAccess(false);
          setHasPendingRequest(true);
          setIsTenantOwner(false);
          return;
        }

        // Check if user is a tenant member
        const { data: tenantUser, error: tenantUserError } = await supabase
          .from("tenant_users")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (tenantUserError && tenantUserError.code !== "PGRST116") {
          throw tenantUserError;
        }

        if (tenantUser) {
          setHasTenantAccess(true);
          setHasPendingRequest(false);
          setIsTenantOwner(false);
        } else {
          setHasTenantAccess(false);
          setHasPendingRequest(false);
          setIsTenantOwner(false);
        }
      } catch (error) {
        console.error("Error checking tenant access:", error);
        setHasTenantAccess(false);
        setHasPendingRequest(false);
        setIsTenantOwner(false);
      }
    };

    checkTenantAccess();
  }, [user, tenantId, tenantOwnerId, tenantData]);

  useEffect(() => {
    const getUserPrimaryTenant = async () => {
      try {
        if (isLoading) return;
        if (!user) return;

        if (urlTenantAlias) return;
        if (tenantData) return;

        setIsLoading(true);

        const { data: ownTenant, error: ownTenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("tenant_owner_id", user.id)
          .single();

        if (ownTenantError) {
          console.error("Error fetching owner tenant:", ownTenantError);
          return;
        }

        if (ownTenant) {
          setTenantId(ownTenant.id);
          setTenantData(ownTenant);
          setIsLoading(false);
          setHasTenantAccess(true);
          setHasPendingRequest(false);
          setIsTenantOwner(true);

          return;
        }

        const { data: primaryTenantUser, error: primaryTenantUserError } =
          await supabase
            .from("tenant_users")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_primary", true)
            .single();

        if (primaryTenantUserError) {
          console.error(
            "Error fetching primary tenant:",
            primaryTenantUserError
          );
          return;
        }

        if (primaryTenantUser) {
          const { data: primaryTenant, error: primaryTenantError } =
            await supabase
              .from("tenants")
              .select("*")
              .eq("id", primaryTenantUser.tenant_id)
              .single();

          if (primaryTenantError) {
            console.error("Error fetching primary tenant:", primaryTenantError);
            return;
          }

          if (primaryTenant) {
            setTenantId(primaryTenant.id);
            setTenantData(primaryTenant);
            setIsLoading(false);
            setHasTenantAccess(true);
          }
        }
      } catch (error) {
        console.error("Error fetching primary tenant:", error);
        setIsLoading(false);
      }
    };

    getUserPrimaryTenant();
  }, [
    user,
    urlTenantAlias,
    tenantId,
    tenantOwnerId,
    tenantData,
    hasTenantAccess,
    hasPendingRequest,
    isLoading,
  ]);

  const contextValue = {
    tenantId,
    urlTenantAlias: urlTenantAlias || tenantData?.workspace,
    tenantData,
    isLoading,
    hasTenantAccess,
    hasPendingRequest,
    tenantOwnerId,
    hasTenantInUrl: !!urlTenantAlias,
    isTenantOwner,
  };

  console.log("contextValue", contextValue);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
