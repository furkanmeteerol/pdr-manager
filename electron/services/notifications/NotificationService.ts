import { Notification } from 'electron';
import { logger } from '../logger/Logger';

export class NotificationService {
  public showNotification(title: string, body: string, onClick?: () => void): void {
    try {
      if (!Notification || typeof Notification.isSupported !== 'function' || !Notification.isSupported()) {
        logger.warn('Desktop notifications are not supported on this platform/environment');
        return;
      }

      const notif = new Notification({
        title,
        body,
        silent: false
      });

      if (onClick) {
        notif.on('click', onClick);
      }

      notif.show();
      logger.info(`Displayed Windows notification: "${title}" - "${body}"`);
    } catch (err) {
      logger.warn('Could not display native notification:', err);
    }
  }
}

export const notificationService = new NotificationService();
