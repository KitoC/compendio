
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTenantFromUrl() {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!urlTenantAlias);
  const [tenantData, setTenantData] = useState<any>(null);
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [tenantOwnerId, setTenantOwnerId] = useState<string | null>(null);

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
        return;
      }

      try {
        // Check if user is the tenant owner
        if (user.id === tenantOwnerId) {
          setHasTenantAccess(true);
          setHasPendingRequest(false);
          return;
        }

        // Check if user has a pending request
        const { data: pendingRequest } = await supabase
          .from("tenant_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .eq("status", "pending")
          .single();

        if (pendingRequest) {
          setHasTenantAccess(false);
          setHasPendingRequest(true);
          return;
        }

        // Check if user is a tenant member
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (tenantUser) {
          setHasTenantAccess(true);
          setHasPendingRequest(false);
        } else {
          setHasTenantAccess(false);
          setHasPendingRequest(false);
        }
      } catch (error) {
        console.error("Error checking tenant access:", error);
        setHasTenantAccess(false);
        setHasPendingRequest(false);
      }
    };

    checkTenantAccess();
  }, [user, tenantId, tenantOwnerId]);
  
  // Return data about tenant from URL and user's access status
  return {
    tenantId, // This is the actual UUID from the database
    urlTenantAlias, // This is the workspace name from the URL
    tenantData, // Full tenant object if needed
    isLoading,
    hasTenantAccess, // Whether the current user has access to this tenant
    hasPendingRequest, // Whether the current user has a pending request
    tenantOwnerId, // The ID of the tenant owner
    // Whether we have a tenant in the URL
    hasTenantInUrl: !!urlTenantAlias,
  };
}
