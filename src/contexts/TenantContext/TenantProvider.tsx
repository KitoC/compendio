
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TenantContext } from "./TenantContext";

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!urlTenantAlias);
  const [tenantData, setTenantData] = useState<any>(null);
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
  }, [user, tenantId, tenantOwnerId]);
  
  const contextValue = {
    tenantId,
    urlTenantAlias,
    tenantData,
    isLoading,
    hasTenantAccess,
    hasPendingRequest,
    tenantOwnerId,
    hasTenantInUrl: !!urlTenantAlias,
    isTenantOwner
  };
  
  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
