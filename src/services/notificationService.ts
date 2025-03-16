
import { websocketService } from "./websocketService";

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationMessage {
  title: string;
  message: string;
  level: NotificationLevel;
  timestamp: string;
}

class NotificationService {
  // Send a notification through the WebSocket
  public sendNotification(title: string, message: string, level: NotificationLevel = 'info'): void {
    websocketService.emit({
      type: 'notification',
      title,
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  // Initialize notification listener
  public initListener(callback: (notification: NotificationMessage) => void): () => void {
    return websocketService.listen((message) => {
      if (message.type === 'notification') {
        callback({
          title: message.title || 'Notification',
          message: message.message,
          level: message.level || 'info',
          timestamp: message.timestamp || new Date().toISOString()
        });
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
