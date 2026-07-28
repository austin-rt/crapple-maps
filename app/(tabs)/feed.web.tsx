import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed';
import { Avatar, SignInRequired } from '@/components/ui';
import { useFeed } from '@/hooks/useLogs';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { ACCENT } from '@/lib/tokens';

// Web feed — a Twitter-style centered timeline: a composer pinned at the top,
// posts below, capped to a readable column. Native uses feed.tsx (plain list).
export default function FeedScreen() {
  const { session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useFeed(session?.user.id);
  const { data: me } = useProfile(session?.user.id ?? '');

  if (!session) {
    return <SignInRequired icon="newspaper-outline" message="See what friends are up to." />;
  }

  const logs = data?.pages.flat() ?? [];
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const composer = (
    <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
      <Avatar seed={me?.avatar_seed || me?.username || session.user.id} size={44} />
      <Pressable
        onPress={() => router.push('/compose')}
        className="flex-1 rounded-full border border-line px-4 py-2.5 active:opacity-70">
        <Text className="text-[15px] text-content-2">Share a find…</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/compose')}
        className="rounded-full px-5 py-2 active:opacity-80"
        style={{ backgroundColor: ACCENT }}>
        <Text className="font-semibold text-white">Post</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 items-center bg-surface">
      <View style={{ width: '100%', maxWidth: 600, flex: 1 }} className="border-x border-line">
        <FlatList
          data={logs}
          keyExtractor={(i, idx) => i.id + idx}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          onEndReachedThreshold={0.6}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          ListHeaderComponent={composer}
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
                  Follow friends, or tap Post to add your first one. It’ll show up here.
                </Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}
