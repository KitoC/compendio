
import { websocketService } from "./websocketService";
import { toast } from "@/hooks/use-toast";

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

  // Show a toast notification locally
  public showToast(title: string, message: string, level: NotificationLevel = 'info'): void {
    switch (level) {
      case 'success':
        toast.success(message, title);
        break;
      case 'error':
        toast.error(message, title);
        break;
      case 'warning':
        toast.show({
          title: title,
          description: message,
          variant: 'destructive',
        });
        break;
      case 'info':
      default:
        toast.show({
          title: title,
          description: message,
        });
        break;
    }
  }

  // Initialize notification listener
  public initListener(callback: (notification: NotificationMessage) => void): () => void {
    return websocketService.listen((message) => {
      if (message.type === 'notification') {
        try {
          const notification: NotificationMessage = {
            title: message.title || 'Notification',
            message: message.message,
            level: message.level || 'info',
            timestamp: message.timestamp || new Date().toISOString()
          };
          
          callback(notification);
          
          // Also show a toast for the notification
          this.showToast(notification.title, notification.message, notification.level);
        } catch (error) {
          console.error('Error handling notification:', error);
        }
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
