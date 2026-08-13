import { useProfile } from './useProfile';

export type AgeGateState = 'loading' | 'ask' | 'waiting' | 'ok';

// Evaluated fresh on every render against the clock, so a user blocked at 12
// becomes eligible on their 13th birthday with no re-prompt and nothing to
// re-enter. 'ask' = never answered, 'waiting' = answered but not old enough yet.
export function useAgeGate(uid?: string): AgeGateState {
  const { data, isLoading } = useProfile(uid ?? '');
  if (!uid) return 'ok'; // caller handles the signed-out case
  if (isLoading || !data) return 'loading';
  const eligibleAt = data.age_eligible_at ? new Date(data.age_eligible_at) : null;
  if (!eligibleAt) return 'ask';
  return eligibleAt.getTime() <= Date.now() ? 'ok' : 'waiting';
}
