import { createContext, useContext } from "react";

interface NotificationContextType {
  emailCount: number;
  setEmailCount: (emailCount: number) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  setNotifications: () => {},
  emailCount: 0,
  setEmailCount: () => {},
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
