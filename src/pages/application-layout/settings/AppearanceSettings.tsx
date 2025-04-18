import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/contexts/UserSettingsProvider";

import Page from "@/components/Page";
const AppearanceSettings = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme, isLoading } = useUserSettings();

  const handleSaveAppearance = async () => {
    if (!user || !tenantId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("configs").upsert(
        {
          name: "appearance",
          user_id: user.id,
          tenant_id: tenantId,
          config: { theme },
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

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Page>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-medium mb-4">Appearance</h2>
          <p className="text-muted-foreground mb-4">
            Customize how the application looks and feels.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveAppearance} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </Page>
  );
};

export default AppearanceSettings;
