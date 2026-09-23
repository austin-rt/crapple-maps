import { useQuery } from '@tanstack/react-query';

import { fetchInBounds, type Bounds } from '@/lib/db/restrooms';
import type { FilterKey } from '@/lib/restrooms/filters';

// Pins for the visible viewport. A plain query, not infinite: a bounds fetch
// returns everything on screen up to the RPC's cap, so there is no next page.
//
// `bounds` arrives already rounded (see useFinder), which is what stops a
// few-metre drag from producing a new key and a refetch. `placeholderData`
// keeps the previous pins on screen while the next set loads, so panning
// never flashes an empty map.
export function useRestroomsInBounds(opts: {
  bounds: Bounds | null;
  filters: Partial<Record<FilterKey, boolean>>;
  enabled: boolean;
}) {
  const b = opts.bounds;
  return useQuery({
    queryKey: ['pins', b?.minLat, b?.minLng, b?.maxLat, b?.maxLng, JSON.stringify(opts.filters)],
    enabled: opts.enabled && !!b,
    queryFn: () => fetchInBounds(b!, opts.filters),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}
