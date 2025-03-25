import { getEnvKey } from "locals/utils/env";
// @ts-expect-error - Supabase client is not typed
import { createClient } from "supabase-js";

export const getClient = (req: Request) => {
  const Authorization = req.headers.get("Authorization");
  const token = Authorization?.replace("Bearer ", "");

  return createClient(
    getEnvKey("SUPABASE_URL"),
    getEnvKey("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: token } } }
  );
};

export const getADMINClient = () => {
  return createClient(
    getEnvKey("SUPABASE_URL"),
    getEnvKey("SUPABASE_SERVICE_ROLE_KEY")
  );
};
