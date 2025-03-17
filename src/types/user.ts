
import { User as SupabaseUser } from "@supabase/supabase-js";

// Extend the Supabase User type to include tenant_id
export interface User extends SupabaseUser {
  tenant_id?: string;
}

// Define the AppearanceSettings interface
export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  accentColor: "blue" | "green" | "purple" | "orange" | "pink";
  borderRadius: "none" | "small" | "medium" | "large";
}

// Default appearance settings
export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "system",
  fontSize: "medium",
  accentColor: "blue",
  borderRadius: "medium",
};
