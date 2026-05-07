import { create } from 'zustand';
import { api } from '@services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  type: 'mentorship' | 'schedule' | 'psychology' | 'report' | 'system';
  severity: 'info' | 'warning' | 'urgent';
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications'); // Створіть цей ендпоінт на бекенді
      const data = res.data.data || res.data || [];
      set({
        notifications: data,
        unreadCount: data.filter((n: NotificationItem) => !n.isRead).length
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },
  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return { notifications: updated, unreadCount: updated.filter(n => !n.isRead).length };
      });
    } catch (err) {}
  },
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (err) {}
  }
}));