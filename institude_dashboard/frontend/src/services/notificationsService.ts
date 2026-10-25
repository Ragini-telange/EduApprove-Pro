import { NotificationItem } from '../types';
import { mockNotificationsList } from '../data/mockNotifications';
import { api } from '../api/client';

export const notificationsService = {
  /**
   * Retrieves notifications with optional unread & type filters
   */
  async getNotifications(params?: {
    unreadOnly?: boolean;
    type?: string;
    institutionId?: string;
  }): Promise<NotificationItem[]> {
    try {
      const live = await api.getNotifications(params?.unreadOnly);
      if (live && live.length) return live;
    } catch {
      // fallback
    }

    let result = [...mockNotificationsList];

    if (params?.unreadOnly) {
      result = result.filter((n) => !n.is_read);
    }

    if (params?.type && params.type !== 'all') {
      const typeLower = params.type.toLowerCase();
      result = result.filter(
        (n) =>
          n.notification_type.toLowerCase().includes(typeLower) ||
          (n.related_entity_type && n.related_entity_type.toLowerCase() === typeLower)
      );
    }

    return result;
  },

  /**
   * Marks a notification as read
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await api.markNotificationRead(id);
    } catch {
      // fallback local update
    }
    const item = mockNotificationsList.find((n) => n.id === id);
    if (item) item.is_read = true;
  },

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.markAllNotificationsRead();
    } catch {
      // fallback
    }
    mockNotificationsList.forEach((n) => {
      n.is_read = true;
    });
  },
};
