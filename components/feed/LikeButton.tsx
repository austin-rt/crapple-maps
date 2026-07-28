import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text } from 'react-native';

import { useLikes } from '@/hooks/useReactions';
import { MUTED } from '@/lib/tokens';

const LIKE_COLOR = '#EF4444';

// Interactive heart + count. Optimistic via useLikes; disabled when signed out.
export function LikeButton({ logId, userId, size = 22 }: { logId: string; userId: string | undefined; size?: number }) {
  const { count, liked, canLike, toggle } = useLikes(logId, userId);
  return (
    <Pressable onPress={() => canLike && toggle()} disabled={!canLike} hitSlop={8} className="flex-row items-center gap-1.5 active:opacity-60">
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={liked ? LIKE_COLOR : MUTED} />
      {count > 0 ? <Text className="text-sm font-medium" style={{ color: liked ? LIKE_COLOR : MUTED }}>{count}</Text> : null}
    </Pressable>
  );
}
