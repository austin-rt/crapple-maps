import { Pressable, Text } from 'react-native';

import type { FollowStatus } from '@/lib/db/follows';
import { ACCENT } from '@/lib/tokens';

export function FollowButton({ status, onToggle }: { status: FollowStatus | undefined; onToggle: () => void }) {
  const label = status === 'approved' ? 'Following' : status === 'pending' ? 'Requested' : 'Follow';
  const filled = !status;
  return (
    <Pressable
      onPress={onToggle}
      className={`rounded-full px-4 py-1.5 ${filled ? '' : 'border border-line'}`}
      style={filled ? { backgroundColor: ACCENT } : undefined}>
      <Text className={filled ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-content'}>{label}</Text>
    </Pressable>
  );
}
