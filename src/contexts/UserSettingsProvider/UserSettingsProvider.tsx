
import { UserSettingsContext } from "./UserSettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, tenantId } = useAuth();
  const [theme, setTheme] = useState<string>("system");
  const [sidebarConfig, setSidebarConfig] = useState<{ showCustomTables: boolean }>({
    showCustomTables: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (!user) return;

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
          const config = data.config as { theme: string; sidebarConfig?: { showCustomTables: boolean } };
          setTheme(config.theme || "system");
          if (config.sidebarConfig) {
            setSidebarConfig(config.sidebarConfig);
          }
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
      value={{ 
        theme, 
        setTheme, 
        isLoading, 
        sidebarConfig, 
        setSidebarConfig 
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export default UserSettingsProvider;
