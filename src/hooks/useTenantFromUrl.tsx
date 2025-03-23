
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useTenantFromUrl() {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const { tenantId: authTenantId, hasTenant } = useAuth();
  
  // Return data about tenant from URL
  return {
    urlTenantId,
    // Whether the URL tenant matches the authenticated tenant
    isCurrentTenant: urlTenantId === authTenantId,
    // Whether we have a tenant in the URL
    hasTenantInUrl: !!urlTenantId,
  };
}
