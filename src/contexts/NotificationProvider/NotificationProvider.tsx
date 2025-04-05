import { ReactNode, useState } from "react";
import { NotificationContext } from "./NotificationContext";

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailCount, setEmailCount] = useState<number>(0);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        emailCount,
        setEmailCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
