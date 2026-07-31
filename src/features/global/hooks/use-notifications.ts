import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/features/global/services/actions';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdOn: string;
  path: string;
  addressedTo: string;
  isRead: boolean;
  notificationType: string;
  eventId?: string | null;
}

export interface NotificationsResponse {
  notifications: Array<NotificationItem>;
  totalCount: number;
  unreadCount?: number;
}

export function useRecentNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/recent');
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useAllNotifications(filter: 'all' | 'unread' = 'all') {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'list', filter],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?filter=${filter}`);
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await markAllNotificationsAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
