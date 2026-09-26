import { Pressable, Text } from 'react-native';

import { confirmAction } from '@/lib/confirm';
import type { FollowStatus } from '@/lib/db/follows';
import { ACCENT } from '@/lib/tokens';

// Following / Requested ask before undoing, so a stray tap can't silently drop
// a follow (re-following then needs the other person's approval again).
export function FollowButton({
  status,
  onToggle,
  username,
}: {
  status: FollowStatus | undefined;
  onToggle: () => void;
  username?: string;
}) {
  const who = username ? `@${username}` : 'them';
  const press = () =>
    status
      ? confirmAction(
          status === 'pending' ? 'Cancel follow request?' : `Unfollow ${who}?`,
          status === 'pending' ? `${who} won't see your request anymore.` : `Following ${who} again will need their approval.`,
          onToggle,
          { confirmLabel: status === 'pending' ? 'Cancel request' : 'Unfollow', destructive: true },
        )
      : onToggle();
  const label = status === 'approved' ? 'Following' : status === 'pending' ? 'Requested' : 'Follow';
  const filled = !status;
  return (
    <Pressable
      onPress={press}
      className={`rounded-full px-4 py-1.5 ${filled ? '' : 'border border-line'}`}
      style={filled ? { backgroundColor: ACCENT } : undefined}>
      <Text className={filled ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-content'}>{label}</Text>
    </Pressable>
  );
}
