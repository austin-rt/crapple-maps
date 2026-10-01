import { useQuery } from '@tanstack/react-query';

import { fetchNotifications, fetchUnreadCount } from '@/lib/db/notifications';

export function useUnreadCount(me: string | undefined) {
  const { data = 0 } = useQuery({
    queryKey: ['notif-unread', me],
    enabled: !!me,
    queryFn: () => fetchUnreadCount(me!),
    refetchInterval: 30_000,
  });
  return me ? data : 0;
}

export function useNotifications(me: string | undefined) {
  return useQuery({
    queryKey: ['notifications', me],
    enabled: !!me,
    queryFn: () => fetchNotifications(me!),
  });
}
