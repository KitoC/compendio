
import { UserSettingsContext } from "./UserSettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [theme, setTheme] = useState<string>("system");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (!user || !tenantId) return;

      try {
        const { data, error } = await supabase
          .from("configs")
          .select("config")
          .eq("name", "appearance")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setTheme((data.config as { theme: string }).theme || "system");
        }
      } catch (error) {
        console.error("Error fetching user config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserConfig();
  }, [user, tenantId]);

  return (
    <UserSettingsContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export default UserSettingsProvider;
