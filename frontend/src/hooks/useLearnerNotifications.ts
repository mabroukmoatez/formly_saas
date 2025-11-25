import { useState, useEffect, useCallback } from 'react';
import {
  getLearnerNotifications,
  getLearnerNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  LearnerNotification,
  NotificationCount,
} from '../services/learner';

interface UseLearnerNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  page?: number;
  perPage?: number;
  status?: 'all' | 'read' | 'unread';
}

export const useLearnerNotifications = (options: UseLearnerNotificationsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    page = 1,
    perPage = 15,
    status = 'all',
  } = options;

  const [notifications, setNotifications] = useState<LearnerNotification[]>([]);
  const [count, setCount] = useState<NotificationCount>({ unread_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await getLearnerNotifications({ page, per_page: perPage, status });
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, status]);

  const fetchCount = useCallback(async () => {
    try {
      const response = await getLearnerNotificationCount();
      if (response.success && response.data) {
        setCount(response.data);
      }
    } catch (err) {
      // Silent error for count
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string | number) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === Number(notificationId) || notif.uuid === notificationId
              ? { ...notif, is_seen: true }
              : notif
          )
        );
        // Refresh count
        await fetchCount();
      }
    } catch (err) {
      // Silent error
    }
  }, [fetchCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        // Update local state
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_seen: true })));
        // Refresh count
        await fetchCount();
      }
    } catch (err) {
      // Silent error
    }
  }, [fetchCount]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchCount();
  }, [fetchNotifications, fetchCount]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCount();
      if (status === 'all' || status === 'unread') {
        fetchNotifications();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCount, fetchNotifications, status]);

  return {
    notifications,
    count,
    loading,
    error,
    pagination,
    refetch: fetchNotifications,
    refetchCount: fetchCount,
    markAsRead,
    markAllAsRead,
  };
};

