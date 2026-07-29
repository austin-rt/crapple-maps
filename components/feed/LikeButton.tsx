import { Icon } from '@/components/ui';
import { Pressable, Text } from 'react-native';

import { useLikes } from '@/hooks/useReactions';
import { LIKE } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

export function LikeButton({ logId, userId, size = 22 }: { logId: string; userId: string | undefined; size?: number }) {
  const { count, liked, canLike, toggle } = useLikes(logId, userId);
  const c = useColors();
  return (
    <Pressable onPress={() => canLike && toggle()} disabled={!canLike} hitSlop={8} className="flex-row items-center gap-1.5 active:opacity-60">
      <Icon name={liked ? 'heart' : 'heart-outline'} size={size} color={liked ? LIKE : c.content2} />
      {count > 0 ? <Text className="text-sm font-medium" style={{ color: liked ? LIKE : c.content2 }}>{count}</Text> : null}
    </Pressable>
  );
}
