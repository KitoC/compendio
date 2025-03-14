import { ReactNode } from "react";
import defaultTheme, { ThemeConfig } from "../../config/theme.config";
import { PartialDeep } from "type-fest";
import { ThemeContext } from "./context";

interface ThemeProviderProps {
  theme?: PartialDeep<ThemeConfig>;
  children: ReactNode;
}

export const ThemeProvider = ({ theme, children }: ThemeProviderProps) => {
  // Deep merge the default theme with any overrides
  const mergedTheme: ThemeConfig = {
    colors: {
      ...defaultTheme.colors,
      ...theme?.colors,
    },
    branding: {
      ...defaultTheme.branding,
      ...theme?.branding,
    },
    chat: {
      ...defaultTheme.chat,
      ...theme?.chat,
    },
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
