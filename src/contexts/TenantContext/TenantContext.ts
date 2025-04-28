import { Database } from "@/integrations/supabase/types";
import { createContext, useContext } from "react";

export type TenantData = Database["public"]["Tables"]["tenants"]["Row"];
export interface TenantContextType {
  tenantId: string | null;
  urlTenantAlias: string | null;
  tenantData: TenantData | null;
  isLoading: boolean;
  hasTenantAccess: boolean;
  hasPendingRequest: boolean;
  tenantOwnerId: string | null;
  hasTenantInUrl: boolean;
  isTenantOwner: boolean;
  createNewTenant: (name?: string) => Promise<void>;
  error: Error | { code: string; message: string } | null;
  setError: (error: Error | null) => void;
  isCreatingTenant: boolean;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
