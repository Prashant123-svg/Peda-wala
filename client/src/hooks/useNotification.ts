import { useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const notification: Notification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => removeNotification(id), duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, duration?: number) =>
      addNotification(message, "success", duration),
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      addNotification(message, "error", duration),
    [addNotification]
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      addNotification(message, "info", duration),
    [addNotification]
  );

  return {
    notifications,
    removeNotification,
    addNotification,
    success,
    error,
    info,
  };
};
