import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useBlockedIds } from '@/hooks/useModeration';
import { fetchFeed, fetchLog, fetchLoggedRestroomIds, fetchMyLogs } from '@/lib/db/logs';
import type { FeedLog } from '@/lib/types';

const FEED_PAGE = 20;

export function useFeed(userId: string | undefined) {
  const { data: blocked } = useBlockedIds(userId);
  // Drop blocked users' posts at read time — pagination math still uses the raw
  // page length, so a filtered-out post never stalls infinite scroll.
  const select = useCallback(
    (data: { pages: FeedLog[][]; pageParams: unknown[] }) =>
      blocked?.size ? { ...data, pages: data.pages.map((p) => p.filter((l) => !blocked.has(l.user_id))) } : data,
    [blocked],
  );
  return useInfiniteQuery({
    queryKey: ['feed', userId],
    enabled: !!userId,
    initialPageParam: 0,
    getNextPageParam: (last: FeedLog[], all) => (last.length === FEED_PAGE ? all.length * FEED_PAGE : undefined),
    queryFn: ({ pageParam }) => fetchFeed(pageParam as number, FEED_PAGE),
    select,
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
