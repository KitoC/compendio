
import { useState, useEffect, ReactNode } from "react";
import { AppearanceContext } from "./AppearanceContext";
import { AppearanceSettings, DEFAULT_APPEARANCE_SETTINGS } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AppearanceProviderProps {
  children: ReactNode;
}

export const AppearanceProvider = ({ children }: AppearanceProviderProps) => {
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);
  const { user } = useAuth();

  // Load settings from localStorage or backend when component mounts
  useEffect(() => {
    const loadAppearanceSettings = async () => {
      if (!user) return;

      try {
        // Try to load from localStorage first
        const storedSettings = localStorage.getItem("appearance-settings");
        if (storedSettings) {
          setAppearance(JSON.parse(storedSettings));
          return;
        }

        // If not in localStorage, try to load from database
        const { data, error } = await supabase
          .from("configs")
          .select("config")
          .eq("domain", "appearance")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // If no settings found, use defaults
          if (error.code !== "PGRST116") { // Not found error
            console.error("Error loading appearance settings:", error);
          }
          return;
        }

        if (data?.config) {
          const settings = data.config as AppearanceSettings;
          setAppearance(settings);
          // Cache in localStorage
          localStorage.setItem("appearance-settings", JSON.stringify(settings));
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error);
      }
    };

    loadAppearanceSettings();
  }, [user]);

  // Apply settings when they change
  useEffect(() => {
    // Apply theme
    const root = window.document.documentElement;

    // Remove old classes
    root.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    root.classList.remove("radius-none", "radius-small", "radius-medium", "radius-large");
    root.classList.remove("accent-blue", "accent-green", "accent-purple", "accent-orange", "accent-pink");

    // Add new classes
    root.classList.add(`font-size-${appearance.fontSize}`);
    root.classList.add(`radius-${appearance.borderRadius}`);
    root.classList.add(`accent-${appearance.accentColor}`);

    // For theme, we'll rely on next-themes ThemeProvider
    localStorage.setItem("theme", appearance.theme);
    
  }, [appearance]);

  const updateAppearance = async (settings: Partial<AppearanceSettings>) => {
    if (!user) return;

    try {
      const newSettings = { ...appearance, ...settings };
      
      // Update state
      setAppearance(newSettings);
      
      // Save to localStorage for quick access
      localStorage.setItem("appearance-settings", JSON.stringify(newSettings));
      
      // Save to database for persistence across devices
      const { error } = await supabase
        .from("configs")
        .upsert({
          domain: "appearance",
          user_id: user.id,
          tenant_id: user.tenant_id,
          config: newSettings,
          name: "user-appearance"
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Appearance updated",
        description: "Your appearance settings have been saved.",
      });
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: "There was a problem saving your appearance settings.",
      });
    }
  };

  return (
    <AppearanceContext.Provider value={{ appearance, updateAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
};
