import { useProfile } from './useProfile';

export type AgeGateState = 'loading' | 'blocked' | 'ok';

// Social surfaces call this after their own session check. Returns 'loading'
// until the profile is known, so an unverified account never flashes the feed
// before the gate mounts.
export function useAgeGate(uid?: string): AgeGateState {
  const { data, isLoading } = useProfile(uid ?? '');
  if (!uid) return 'ok'; // caller handles the signed-out case
  if (isLoading || !data) return 'loading';
  return data.age_verified_at ? 'ok' : 'blocked';
}
