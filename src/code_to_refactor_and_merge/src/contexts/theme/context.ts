import { createContext, useContext } from "react";
import defaultTheme, { ThemeConfig } from "../../config/theme.config";

export const ThemeContext = createContext<ThemeConfig>(defaultTheme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
