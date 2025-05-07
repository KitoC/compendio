import { UserSettingsContext, TimeSettings } from "./UserSettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const UserSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [theme, setTheme] = useState<string>("system");
  const [isLoading, setIsLoading] = useState(true);

  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    timeZone: "Australia/Sydney",
    timeFormat: "12h",
    dateFormat: "D MMM, YYYY",
  });

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (!user || !tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("configs")
          .select("config")
          .eq("name", "appearance")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId);

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data[0]) {
          setTheme((data[0].config as { theme: string }).theme || "system");
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
    <UserSettingsContext.Provider
      value={{ theme, setTheme, isLoading, timeSettings, setTimeSettings }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export default UserSettingsProvider;
