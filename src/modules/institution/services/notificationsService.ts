import { NotificationItem } from '../types';
import { mockNotificationsList } from '../data/mockNotifications';
import { api } from '../api/client';
import { notifications } from '../../../services/notifications/notificationsService';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';

export const notificationsService = {
  /**
   * Retrieves notifications with optional unread & type filters
   */
  async getNotifications(params?: {
    unreadOnly?: boolean;
    type?: string;
    institutionId?: string;
  }): Promise<NotificationItem[]> {
    // 1. Live Supabase notifications
    if (isSupabaseConfigured && supabase) {
      try {
        const canonicalNotifs = await notifications.getForUser(undefined, 'institution');
        if (canonicalNotifs && canonicalNotifs.length > 0) {
          const mapped: NotificationItem[] = canonicalNotifs.map((n, idx) => ({
            id: idx + 1,
            institution_id: params?.institutionId || 'inst_wro_01',
            title: n.title,
            message: n.message,
            notification_type:
              n.category.includes('Correction') || n.category.includes('Deficiency')
                ? 'Correction Required'
                : n.category.includes('EVC')
                ? 'EVC Scheduled'
                : n.category.includes('Compliance')
                ? 'Compliance'
                : 'Application',
            severity: n.severity || 'info',
            is_read: n.isRead,
            created_at: n.createdAt,
            time_ago: 'Just now',
          }));

          let result = mapped;
          if (params?.unreadOnly) {
            result = result.filter((n) => !n.is_read);
          }
          if (params?.type && params.type !== 'all') {
            const typeLower = params.type.toLowerCase();
            result = result.filter((n) => n.notification_type.toLowerCase().includes(typeLower));
          }
          if (result.length > 0) return result;
        }
      } catch (err) {
        console.warn('Supabase notifications query failed, falling back:', err);
      }
    }

    // 2. Fallback mock list
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
      await notifications.markAsRead(`notif-${id}`);
    } catch {
      // fallback
    }
    const item = mockNotificationsList.find((n) => n.id === id);
    if (item) item.is_read = true;
  },

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    mockNotificationsList.forEach((n) => (n.is_read = true));
  },
};
