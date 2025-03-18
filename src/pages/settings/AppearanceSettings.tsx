
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AppearanceSettings = () => {
  const { theme, setTheme, sidebarConfig, updateSidebarConfig } = useUserSettings();
  const [themeValue, setThemeValue] = useState(theme);

  const handleThemeChange = (newTheme: string) => {
    setThemeValue(newTheme);
    setTheme(newTheme);
  };

  const handleSidebarSettingChange = (showSettings: boolean) => {
    updateSidebarConfig({ showSettings });
    toast.success(`Settings ${showSettings ? 'shown' : 'hidden'} in sidebar`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme-light" className="flex-1">Light</Label>
            <input
              type="radio"
              id="theme-light"
              name="theme"
              value="light"
              checked={themeValue === "light"}
              onChange={() => handleThemeChange("light")}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme-dark" className="flex-1">Dark</Label>
            <input
              type="radio"
              id="theme-dark"
              name="theme"
              value="dark"
              checked={themeValue === "dark"}
              onChange={() => handleThemeChange("dark")}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme-system" className="flex-1">System</Label>
            <input
              type="radio"
              id="theme-system"
              name="theme"
              value="system"
              checked={themeValue === "system"}
              onChange={() => handleThemeChange("system")}
              className="h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>
            Customize the navigation elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Label htmlFor="show-settings">Show Settings in Sidebar</Label>
              <p className="text-sm text-muted-foreground">
                Display the Settings icon in the sidebar navigation
              </p>
            </div>
            <Switch
              id="show-settings"
              checked={sidebarConfig.showSettings}
              onCheckedChange={handleSidebarSettingChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;
