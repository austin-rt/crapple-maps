import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchFeed, fetchLog, fetchLoggedRestroomIds, fetchMyLogs } from '@/lib/db/logs';
import type { FeedLog } from '@/lib/types';

const FEED_PAGE = 20;

export function useFeed(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['feed', userId],
    enabled: !!userId,
    initialPageParam: 0,
    getNextPageParam: (last: FeedLog[], all) => (last.length === FEED_PAGE ? all.length * FEED_PAGE : undefined),
    queryFn: ({ pageParam }) => fetchFeed(pageParam as number, FEED_PAGE),
  });
}

export function useMyLogs(userId: string | undefined) {
  return useQuery({ queryKey: ['my-logs', userId], enabled: !!userId, queryFn: () => fetchMyLogs(userId!) });
}

export function useLog(id: string) {
  return useQuery({ queryKey: ['post', id], queryFn: () => fetchLog(id) });
}

export function useLoggedRestroomIds(userId: string | undefined) {
  return useQuery({ queryKey: ['logged-restroom-ids', userId], enabled: !!userId, queryFn: () => fetchLoggedRestroomIds(userId!) });
}
