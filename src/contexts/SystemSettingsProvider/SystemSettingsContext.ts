import { createContext, useContext } from "react";

export interface SystemSettings {
  configs: Record<string, unknown>;
  consts: Record<string, unknown>;
}

export const SystemSettingsContext = createContext<SystemSettings | undefined>(
  undefined
);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);

  if (!context) {
    throw new Error(
      "useSystemSettings must be used within a SystemSettingsProvider"
    );
  }
  return context;
};
