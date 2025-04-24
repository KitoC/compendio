import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ICredential } from "../types";

type UseCredentialsQueryProps = {
  service_type: string;
  authType: string;
  provider: string;
  tenantId: string;
};

export const useCredentialsQuery = ({
  service_type,
  authType,
  provider,
  tenantId,
}: UseCredentialsQueryProps) => {
  return useQuery({
    queryKey: ["existingCredentials", service_type, authType, provider],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select(
          "id, name, username, domain, created_at, scopes, type, associated_email"
        )
        .eq("tenant_id", tenantId)
        .eq("type", authType)
        .eq("provider", provider)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as ICredential[];
    },
    enabled: !!service_type && !!authType && !!provider && !!tenantId,
    placeholderData: [],
  });
};
