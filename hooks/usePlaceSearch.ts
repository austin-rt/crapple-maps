import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from './useDebouncedValue';

export type Place = { lat: string; lon: string; display_name: string };

export function usePlaceSearch(query: string) {
  const q = useDebouncedValue(query.trim(), 450);
  const enabled = q.length >= 3;
  const { data = [], isFetching } = useQuery({
    queryKey: ['place-search', q],
    enabled,
    queryFn: async (): Promise<Place[]> => {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'CrappleMaps/1.0 (poc)' },
      });
      return (await r.json()) as Place[];
    },
  });
  return { results: enabled ? data : [], searching: enabled && isFetching };
}
