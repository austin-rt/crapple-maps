import { Icon } from '@/components/ui';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Stars } from '@/components/ui';
import { useBlock } from '@/hooks/useModeration';
import { useAuth } from '@/lib/auth';
import { bristol } from '@/lib/bristol';
import { timeAgo } from '@/lib/format';
import { moderationMenu } from '@/lib/moderate';
import { useColors } from '@/lib/theme';
import type { FeedLog } from '@/lib/types';

import { FeedPhotos } from './FeedPhotos';

export function FeedCard({ log }: { log: FeedLog }) {
  const a = log.author;
  const name = a?.display_name || a?.username || 'Someone';
  const b = bristol(log.bristol_type);
  const c = useColors();
  const { session } = useAuth();
  const { block } = useBlock(session?.user.id);
  const mine = session?.user.id === log.user_id;
  return (
    <Pressable onPress={() => router.push(`/log/${log.id}`)} className="flex-row gap-3 border-b border-line px-4 py-3 active:bg-surface-2">
      {a?.avatar_url ? (
        <Image source={{ uri: a.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <Avatar seed={a?.avatar_seed || a?.username || log.user_id} size={44} />
      )}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-[15px] font-bold text-content" numberOfLines={1}>{name}</Text>
          <Text className="ml-1 flex-shrink text-[15px] text-content-2" numberOfLines={1}>
            @{a?.username ?? 'user'} · {timeAgo(log.created_at)}
          </Text>
          {log.visibility === 'private' ? <Icon name="lock-closed" size={12} color={c.content2} style={{ marginLeft: 4 }} /> : null}
          {!mine && session ? (
            <Pressable
              hitSlop={10}
              style={{ marginLeft: 'auto' }}
              onPress={() => moderationMenu({ targetType: 'log', targetId: log.id, authorName: name, onBlock: () => block(log.user_id) })}>
              <Icon name="ellipsis-horizontal" size={16} color={c.content2} />
            </Pressable>
          ) : null}
        </View>

        {log.caption ? <Text className="mt-0.5 text-[15px] leading-5 text-content">{log.caption}</Text> : null}

        {(log.rating || b) && (
          <View className="mt-1.5 flex-row items-center gap-2">
            {log.rating ? <Stars value={log.rating} size={14} gap={2} /> : null}
            {b ? (
              <View className="flex-row items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5">
                <Text className="text-xs">{b.emoji}</Text>
                <Text className="text-[11px] font-medium text-content-2">{b.label}</Text>
              </View>
            ) : null}
          </View>
        )}

        {log.photos.length > 0 ? (
          <View className="mt-2">
            <FeedPhotos photos={log.photos} />
          </View>
        ) : null}

        <View className="mt-2 flex-row items-center gap-6">
          <View className="flex-row items-center gap-1.5">
            <Icon name="heart-outline" size={17} color={c.content2} />
            {log.likes_count > 0 ? <Text className="text-xs text-content-2">{log.likes_count}</Text> : null}
          </View>
          <View className="flex-row items-center gap-1.5">
            <Icon name="chatbubble-outline" size={16} color={c.content2} />
            {log.comments_count > 0 ? <Text className="text-xs text-content-2">{log.comments_count}</Text> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
