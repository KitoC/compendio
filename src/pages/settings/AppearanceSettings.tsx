
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/contexts/UserSettingsProvider/UserSettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const AppearanceSettings = () => {
  const { theme, setTheme, sidebarConfig, setSidebarConfig } = useUserSettings();
  const { user, tenantId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (newTheme: string) => {
    if (!user || !tenantId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("configs")
        .upsert({
          tenant_id: tenantId,
          user_id: user.id,
          name: "appearance",
          config: {
            theme: newTheme,
            sidebarConfig: sidebarConfig
          }
        });

      if (error) throw error;
      
      setTheme(newTheme);
      toast.success("Theme updated successfully");
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSidebarConfigChange = async (key: string, value: boolean) => {
    if (!user || !tenantId) return;
    
    setIsSaving(true);
    try {
      const newConfig = {
        ...sidebarConfig,
        [key]: value
      };
      
      const { error } = await supabase
        .from("configs")
        .upsert({
          tenant_id: tenantId,
          user_id: user.id,
          name: "appearance",
          config: {
            theme,
            sidebarConfig: newConfig
          }
        });

      if (error) throw error;
      
      setSidebarConfig(newConfig);
      toast.success("Sidebar configuration updated");
    } catch (error) {
      console.error("Error saving sidebar config:", error);
      toast.error("Failed to save sidebar configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Appearance Settings</h2>
        <p className="text-muted-foreground">
          Customize the appearance of your application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred color theme for the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem
                value="light"
                id="theme-light"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 rounded-md border border-border p-1">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full text-center font-normal">
                  Light
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="dark"
                id="theme-dark"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 rounded-md border border-border p-1">
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full text-center font-normal">
                  Dark
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="system"
                id="theme-system"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 rounded-md border border-border p-1">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full text-center font-normal">
                  System
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sidebar Configuration</CardTitle>
          <CardDescription>
            Customize what appears in your sidebar navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="show-custom-tables" className="flex flex-col space-y-1">
                <span>Show Custom Tables</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Display custom tables in the sidebar under a "Tables" section.
                </span>
              </Label>
              <Switch 
                id="show-custom-tables" 
                checked={sidebarConfig.showCustomTables}
                onCheckedChange={(checked) => handleSidebarConfigChange('showCustomTables', checked)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="show-settings" className="flex flex-col space-y-1">
                <span>Show Settings</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Display the Settings item in the sidebar.
                </span>
              </Label>
              <Switch 
                id="show-settings" 
                checked={sidebarConfig.showSettings}
                onCheckedChange={(checked) => handleSidebarConfigChange('showSettings', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;
