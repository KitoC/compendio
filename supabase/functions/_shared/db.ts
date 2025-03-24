import { getEnvKey } from "locals/utils/env";
import {
  createClient,
  SupabaseClient,
  // @ts-expect-error - Supabase client is not typed
} from "https://esm.sh/@supabase/supabase-js@2.8.0";

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
    getEnvKey("SUPABASE_SERVICE_ROLE_KEY"),
    {
      global: {
        headers: {
          "x-postgres-settings": JSON.stringify({
            "app.encryption_key": getEnvKey("ENCRYPTION_KEY")!,
          }),
        },
      },
    }
  );
};
