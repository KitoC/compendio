
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import { Switch } from "@/components/ui/switch";

const AppearanceSettings = () => {
  const { user, tenantId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme, isLoading, sidebarConfig, setSidebarConfig } = useUserSettings();

  const handleSaveAppearance = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("configs").upsert(
        {
          name: "appearance",
          user_id: user.id,
          tenant_id: tenantId,
          config: { 
            theme,
            sidebarConfig
          },
        },
        { onConflict: "user_id, tenant_id, name" }
      );

      if (error) throw error;
      toast.success("Appearance settings saved");
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save appearance settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCustomTables = (checked: boolean) => {
    setSidebarConfig({
      ...sidebarConfig,
      showCustomTables: checked,
    });
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium mb-4">Appearance</h2>
        <p className="text-muted-foreground mb-4">
          Customize how the application looks and feels.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="theme" className="text-base">
                Theme
              </Label>
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="mt-3 space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="sidebar-config" className="text-base">
                Sidebar Configuration
              </Label>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-custom-tables">Show Custom Tables in Sidebar</Label>
                  <Switch
                    id="show-custom-tables"
                    checked={sidebarConfig.showCustomTables}
                    onCheckedChange={handleToggleCustomTables}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveAppearance} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
