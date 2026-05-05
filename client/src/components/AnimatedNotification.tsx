import React from "react";
import { Notification } from "../hooks/useNotification";

interface NotificationContainerProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

interface SimpleNotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemoveNotification,
}) => {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-md px-4 sm:max-w-lg pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type} animate-in pointer-events-auto rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 ${
            notification.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
          onAnimationEnd={() => onRemoveNotification(notification.id)}
        >
          <div className="notification-content flex-1">
            <span className="notification-message font-semibold">{notification.message}</span>
          </div>
          <button
            className="notification-close flex-shrink-0 hover:opacity-70 transition-opacity"
            onClick={() => onRemoveNotification(notification.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

// Default simple notification component for inline usage
const AnimatedNotification: React.FC<SimpleNotificationProps> = ({
  message,
  type,
}) => {
  return (
    <div className={`notification notification-${type} animate-in`}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
};

export default AnimatedNotification;
