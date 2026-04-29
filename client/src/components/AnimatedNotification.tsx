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
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type} animate-in`}
          onAnimationEnd={() => onRemoveNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => onRemoveNotification(notification.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
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
