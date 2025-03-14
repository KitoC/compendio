import { ROUTES } from "@/lib/constants";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useLocation } from "react-router-dom";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Get the current location to check if we're on the landing page
  const location = useLocation();
  const isLandingPage = location.pathname === ROUTES.INDEX;

  // Disable dark theme on the landing page
  const forcedTheme = isLandingPage ? "light" : undefined;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
