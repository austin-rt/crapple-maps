import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ACCENT, useAuth } from '@/lib/auth';
import { bristol } from '@/lib/bristol';
import { fetchLogPhotos } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

const PAGE = 20;

type Author = { username: string; display_name: string | null; avatar_url: string | null; avatar_seed: string | null };
type Log = {
  id: string;
  user_id: string;
  rating: number | null;
  bristol_type: number | null;
  caption: string | null;
  visibility: 'friends' | 'private';
  created_at: string;
  author: Author | null;
  photos: string[];
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Stars({ value }: { value: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= value ? 'star' : 'star-outline'} size={14} color={n <= value ? ACCENT : '#9CA3AF'} />
      ))}
    </View>
  );
}

// Content column width = screen − horizontal padding (16·2) − avatar (44) − gap (12).
const CONTENT_W = Dimensions.get('window').width - 88;

function Photos({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  if (photos.length === 1) {
    return <Image source={{ uri: photos[0] }} style={{ width: CONTENT_W, height: 200, borderRadius: 14 }} contentFit="cover" />;
  }
  const size = (CONTENT_W - 4) / 2; // 2-up grid, 4px gutter
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: CONTENT_W, borderRadius: 14, overflow: 'hidden' }}>
      {photos.slice(0, 4).map((uri, i) => (
        <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ))}
    </View>
  );
}

// Twitter-style post row: avatar left, everything else stacked on the right.
function FeedCard({ log }: { log: Log }) {
  const a = log.author;
  const name = a?.display_name || a?.username || 'Someone';
  const b = bristol(log.bristol_type);
  return (
    <Pressable
      onPress={() => router.push(`/log/${log.id}`)}
      className="flex-row gap-3 border-b border-line px-4 py-3 active:bg-surface-2">
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
          {log.visibility === 'private' ? <Ionicons name="lock-closed" size={12} color="#9CA3AF" style={{ marginLeft: 4 }} /> : null}
        </View>

        {log.caption ? <Text className="mt-0.5 text-[15px] leading-5 text-content">{log.caption}</Text> : null}

        {(log.rating || b) && (
          <View className="mt-1.5 flex-row items-center gap-2">
            {log.rating ? <Stars value={log.rating} /> : null}
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
            <Photos photos={log.photos} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const { session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['feed', session?.user.id],
    enabled: !!session,
    initialPageParam: 0,
    getNextPageParam: (last: Log[], all) => (last.length === PAGE ? all.length * PAGE : undefined),
    queryFn: async ({ pageParam }): Promise<Log[]> => {
      const { data, error } = await supabase
        .from('logs')
        .select(
          'id,user_id,rating,bristol_type,caption,visibility,created_at, author:profiles(username,display_name,avatar_url,avatar_seed)',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE - 1);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const photos = await fetchLogPhotos(rows.map((r) => r.id));
      return rows.map((r) => ({ ...r, photos: photos[r.id] ?? [] }));
    },
  });

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Ionicons name="newspaper-outline" size={40} color="#9CA3AF" />
        <Text className="mt-3 text-center text-lg text-content-2">
          Sign in on the Profile tab to see what your friends are up to.
        </Text>
      </View>
    );
  }

  const logs = data?.pages.flat() ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={logs}
        keyExtractor={(i, idx) => i.id + idx}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} /> : null}
        renderItem={({ item }) => <FeedCard log={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 64 }} color={ACCENT} />
          ) : (
            <View className="mt-24 items-center px-8">
              <Text className="text-5xl">🚽</Text>
              <Text className="mt-4 text-center text-lg font-semibold text-content">Your feed is empty</Text>
              <Text className="mt-1 text-center text-sm text-content-2">
                Follow friends, or tap Log to add your first one — it’ll show up here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
