import { createContext, useContext } from "react";

export interface TimeSettings {
  timeZone: string;
  timeFormat: string;
  dateFormat: string;
}

export interface UserSettingsContextType {
  theme: string;
  setTheme: (theme: string) => void;
  isLoading: boolean;
  timeSettings: TimeSettings;
  setTimeSettings: React.Dispatch<React.SetStateAction<TimeSettings>>;
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
