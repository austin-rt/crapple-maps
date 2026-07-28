import { useQuery } from '@tanstack/react-query';

import { fetchCodes } from '@/lib/db/codes';
import { fetchRestroomInfo } from '@/lib/db/restrooms';
import { fetchReviews } from '@/lib/db/reviews';
import { fetchVisits } from '@/lib/db/logs';

export function useRestroomInfo(id: string) {
  return useQuery({ queryKey: ['restroom-info', id], queryFn: () => fetchRestroomInfo(id) });
}

export function useRestroomCodes(id: string) {
  return useQuery({ queryKey: ['codes', id], queryFn: () => fetchCodes(id) });
}

export function useRestroomReviews(id: string) {
  return useQuery({ queryKey: ['reviews', id], queryFn: () => fetchReviews(id) });
}

export function useRestroomVisits(id: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['my-visits', id, userId],
    enabled: !!userId,
    queryFn: () => fetchVisits(id, userId!),
  });
}
