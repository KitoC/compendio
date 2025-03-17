
import { createContext, useContext, ReactNode } from "react";
import { AppearanceSettings, DEFAULT_APPEARANCE_SETTINGS } from "@/types/user";

interface AppearanceContextType {
  appearance: AppearanceSettings;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
}

export const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
};
