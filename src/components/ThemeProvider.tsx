
import { ROUTES } from "@/lib/constants";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useLocation } from "react-router-dom";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import { useEffect, useState } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Get the current location to check if we're on the landing page
  const location = useLocation();
  const isLandingPage = location.pathname === ROUTES.INDEX;
  
  // Force light theme on landing page
  const forcedTheme = isLandingPage ? "light" : undefined;
  
  // Use state for theme with a default value
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(props.defaultTheme);
  
  // Try to get user settings
  let userTheme: string | undefined;
  try {
    const { theme } = useUserSettings();
    userTheme = theme;
  } catch (error) {
    // If useUserSettings fails, we'll use the default theme
    userTheme = undefined;
  }
  
  // Update theme when user settings are available
  useEffect(() => {
    if (userTheme) {
      setCurrentTheme(userTheme);
    }
  }, [userTheme]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme || currentTheme}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
