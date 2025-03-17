
import { ROUTES } from "@/lib/constants";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useLocation } from "react-router-dom";
import { useAppearance } from "@/contexts/Appearance";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Get the current location to check if we're on the landing page
  const location = useLocation();
  const isLandingPage = location.pathname === ROUTES.INDEX;
  
  // Get appearance settings from context
  let appearanceTheme: "light" | "dark" | "system" = "system";
  
  try {
    // Try to use the context, but don't crash if not available (e.g., on landing page)
    const { appearance } = useAppearance();
    appearanceTheme = appearance.theme;
  } catch (error) {
    // If we're not in the AppearanceProvider context, use default
    appearanceTheme = "system";
  }

  // Disable dark theme on the landing page
  const forcedTheme = isLandingPage ? "light" : undefined;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={appearanceTheme}
      enableSystem={appearanceTheme === "system"}
      forcedTheme={forcedTheme}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
