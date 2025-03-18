
import { createContext, useContext } from "react";

export interface UserSettingsContextType {
  theme: string;
  setTheme: (theme: string) => void;
  isLoading: boolean;
  sidebarConfig: {
    showCustomTables: boolean;
  };
  setSidebarConfig: (config: { showCustomTables: boolean }) => void;
}

export const UserSettingsContext = createContext<
  UserSettingsContextType | undefined
>(undefined);

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider"
    );
  }
  return context;
};
