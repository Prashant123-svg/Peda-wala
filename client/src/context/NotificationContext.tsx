import React, { createContext, useContext } from "react";
import { useNotification } from "../hooks/useNotification";
import { NotificationContainer } from "../components/AnimatedNotification";

interface NotificationContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifications, removeNotification, success, error, info } = useNotification();

  return (
    <NotificationContext.Provider value={{ success, error, info }}>
      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
};
