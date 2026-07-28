import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed';
import { SignInRequired } from '@/components/ui';
import { useFeed } from '@/hooks/useLogs';
import { useAuth } from '@/lib/auth';
import { ACCENT } from '@/lib/tokens';

export default function FeedScreen() {
  const { session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useFeed(session?.user.id);

  if (!session) {
    return <SignInRequired icon="newspaper-outline" message="See what friends are up to." />;
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
