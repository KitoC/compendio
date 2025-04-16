import { getEnvKey } from "@/utils/env";
// @ts-expect-error - Supabase client is not typed
import { createClient } from "supabase-js";

export const getClient = (Authorization?: string) => {
  return createClient(
    getEnvKey("SUPABASE_URL"),
    getEnvKey("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization } } }
  );
};

export const getADMINClient = () => {
  return createClient(
    getEnvKey("SUPABASE_URL"),
    getEnvKey("SUPABASE_SERVICE_ROLE_KEY")
  );
};
