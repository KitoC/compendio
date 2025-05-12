import type { User as SupabaseUser } from "@supabase/supabase-js";

// Extend the Supabase User type to include tenant_id
export interface User extends SupabaseUser {
  tenant_id: string;
  role?: "admin" | "member" | "guest" | "super-admin" | "tenant-owner";
}

export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}
