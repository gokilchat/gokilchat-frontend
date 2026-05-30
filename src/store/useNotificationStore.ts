import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface Notification {
  id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notif: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const res = await apiFetch('/notifications');
      if (res.success) {
        const list = res.data || [];
        const unread = list.filter((n: Notification) => !n.read_at).length;
        set({ notifications: list, unreadCount: unread });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  },
  addNotification: (notif: Notification) => {
    const current = get().notifications;
    if (current.some(n => n.id === notif.id)) return;
    set({
      notifications: [notif, ...current],
      unreadCount: get().unreadCount + 1
    });
  },
  markAsRead: async (id: string) => {
    try {
      const res = await apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.success) {
        const updated = get().notifications.map(n => 
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        );
        const unread = updated.filter(n => !n.read_at).length;
        set({ notifications: updated, unreadCount: unread });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },
  deleteNotification: async (id: string) => {
    try {
      const res = await apiFetch(`/notifications/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        const updated = get().notifications.filter(n => n.id !== id);
        const unread = updated.filter(n => !n.read_at).length;
        set({ notifications: updated, unreadCount: unread });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  },
  clearAllNotifications: async () => {
    try {
      const res = await apiFetch('/notifications', {
        method: 'DELETE'
      });
      if (res.success) {
        set({ notifications: [], unreadCount: 0 });
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }
}));
