
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTenantFromUrl() {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();
  const { tenantId: authTenantId, hasTenant } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!urlTenantAlias);
  const [tenantData, setTenantData] = useState<any>(null);

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
        }
      } catch (error) {
        console.error("Error in tenant lookup:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantIdFromAlias();
  }, [urlTenantAlias]);
  
  // Return data about tenant from URL
  return {
    tenantId, // This is the actual UUID from the database
    urlTenantAlias, // This is the workspace name from the URL
    tenantData, // Full tenant object if needed
    isLoading,
    // Whether the URL tenant matches the authenticated tenant
    isCurrentTenant: tenantId === authTenantId,
    // Whether we have a tenant in the URL
    hasTenantInUrl: !!urlTenantAlias,
  };
}
