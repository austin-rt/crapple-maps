import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchNearby, fetchRestroomPage } from '@/lib/db/restrooms';
import type { FilterKey } from '@/lib/restrooms/filters';
import type { Restroom } from '@/lib/types';

export const FINDER_PAGE = 40;

// Infinite finder query — RPC when we have a location, else a plain page.
export function useNearbyRestrooms(opts: {
  active: { lat: number; lng: number } | null;
  sort: string;
  filters: Partial<Record<FilterKey, boolean>>;
  enabled: boolean;
}) {
  return useInfiniteQuery({
    queryKey: ['finder', opts.active?.lat, opts.active?.lng, opts.sort, JSON.stringify(opts.filters)],
    enabled: opts.enabled,
    initialPageParam: 0,
    getNextPageParam: (last: Restroom[], all) => (last.length === FINDER_PAGE ? all.length * FINDER_PAGE : undefined),
    queryFn: ({ pageParam }) =>
      opts.active
        ? fetchNearby({
            lat: opts.active.lat,
            lng: opts.active.lng,
            limit: FINDER_PAGE,
            offset: pageParam as number,
            sort: opts.sort,
            filters: opts.filters,
          })
        : fetchRestroomPage(pageParam as number, FINDER_PAGE),
  });
}
