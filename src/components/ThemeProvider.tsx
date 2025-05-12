import { ROUTES } from "@/consts/routes";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useLocation } from "react-router-dom";
import { useUserSettings } from "@/contexts/UserSettingsProvider";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Get the current location to check if we're on the landing page
  const location = useLocation();
  const isLandingPage = location.pathname === ROUTES.INDEX;
  const userSettings = useUserSettings();

  // Force light theme on landing page
  const forcedTheme = isLandingPage ? "light" : undefined;

  return (
    <NextThemesProvider
      key={forcedTheme || userSettings.theme} // Force remount if needed
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme || userSettings.theme}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
