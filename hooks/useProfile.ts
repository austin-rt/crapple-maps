import { useQuery } from '@tanstack/react-query';

import { fetchLogCount, fetchProfile } from '@/lib/db/profiles';

export function useProfile(uid: string) {
  return useQuery({ queryKey: ['profile', uid], queryFn: () => fetchProfile(uid), enabled: !!uid });
}

export function useLogCount(uid: string) {
  return useQuery({ queryKey: ['my-log-count', uid], queryFn: () => fetchLogCount(uid), enabled: !!uid });
}
