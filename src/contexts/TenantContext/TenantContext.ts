
import { createContext, useContext } from "react";

export interface TenantContextType {
  tenantId: string | null;
  urlTenantAlias: string | null;
  tenantData: any | null;
  isLoading: boolean;
  hasTenantAccess: boolean;
  hasPendingRequest: boolean;
  tenantOwnerId: string | null;
  hasTenantInUrl: boolean;
  isTenantOwner: boolean;
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
