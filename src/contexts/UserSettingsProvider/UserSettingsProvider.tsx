
import { UserSettingsContext } from "./UserSettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, tenantId } = useAuth();
  const [theme, setTheme] = useState<string>("system");
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarConfig, setSidebarConfig] = useState({
    showSettings: true, // Default to showing settings
  });

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (!user) return;

      try {
        // Fetch appearance config
        const { data: appearanceData, error: appearanceError } = await supabase
          .from("configs")
          .select("config")
          .eq("name", "appearance")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (appearanceError && appearanceError.code !== "PGRST116") {
          throw appearanceError;
        }

        if (appearanceData) {
          setTheme((appearanceData.config as { theme: string }).theme || "system");
        }

        // Fetch sidebar config
        const { data: sidebarData, error: sidebarError } = await supabase
          .from("configs")
          .select("config")
          .eq("name", "sidebar")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();

        if (sidebarError && sidebarError.code !== "PGRST116") {
          throw sidebarError;
        }

        if (sidebarData && sidebarData.config) {
          setSidebarConfig({
            ...sidebarConfig,
            ...(sidebarData.config as { showSettings?: boolean }),
          });
        }
      } catch (error) {
        console.error("Error fetching user config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserConfig();
  }, [user, tenantId]);

  const updateSidebarConfig = async (config: Partial<typeof sidebarConfig>) => {
    if (!user || !tenantId) return;

    try {
      const newConfig = { ...sidebarConfig, ...config };
      setSidebarConfig(newConfig);

      const { error } = await supabase
        .from("configs")
        .upsert({
          name: "sidebar",
          user_id: user.id,
          tenant_id: tenantId,
          config: newConfig,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating sidebar config:", error);
      toast.error("Failed to save sidebar settings");
    }
  };

  return (
    <UserSettingsContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        isLoading, 
        sidebarConfig, 
        updateSidebarConfig 
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export default UserSettingsProvider;
