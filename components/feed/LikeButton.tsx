import { Icon } from '@/components/ui';
import { Pressable, Text } from 'react-native';

import { useLikes } from '@/hooks/useReactions';
import type { LikeTarget } from '@/lib/db/reactions';
import { LIKE } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

export function LikeButton({ userId, size = 22, ...target }: LikeTarget & { userId: string | undefined; size?: number }) {
  const { count, liked, canLike, toggle } = useLikes(target as LikeTarget, userId);
  const c = useColors();
  return (
    <Pressable
      onPress={() => canLike && toggle()}
      disabled={!canLike}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      className="flex-row items-center gap-1.5 active:opacity-60">
      <Icon name={liked ? 'heart' : 'heart-outline'} size={size} color={liked ? LIKE : c.content2} />
      {count > 0 ? (
        <Text className={size < 18 ? 'text-xs font-medium' : 'text-sm font-medium'} style={{ color: liked ? LIKE : c.content2 }}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
