import { Icon, Input } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { FollowButton, PersonRow } from '@/components/people';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFollows } from '@/hooks/useFollows';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { searchProfiles } from '@/lib/db/profiles';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function People() {
  const ptr = usePullToRefresh();
  const { session } = useAuth();
  const me = session?.user.id;
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q.trim(), 300);

  const { requests, statusFor, follow, unfollow, approve } = useFollows(me);

  const { data: myProfile } = useProfile(me ?? '');
  const realOnly = (myProfile?.kind ?? 'real') === 'real';
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['user-search', debounced, me, realOnly],
    enabled: debounced.length >= 2 && !!me,
    queryFn: () => searchProfiles(debounced, me!, realOnly),
  });

  const c = useColors();
  return (
    <ScrollView className="flex-1 bg-surface" keyboardShouldPersistTaps="handled" refreshControl={ptr.control}>
      <Stack.Screen options={{ title: 'Find people' }} />

      <View className="px-4 pt-3">
        <View className="flex-row items-center rounded-2xl border border-line px-3">
          <Icon name="search" size={16} color={c.content2} />
          <Input
            variant="bare"
            placeholder="Search by username…"
            placeholderTextColor={c.content2}
            value={q}
            onChangeText={setQ}
            autoCapitalize="none"
            className="flex-1 px-2"
          />
          {isFetching ? <ActivityIndicator size="small" color={c.content2} /> : null}
        </View>
      </View>

      {requests.length > 0 ? (
        <View className="mt-4">
          <Text className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-content-2">Follow requests</Text>
          {requests.map(({ followId, prof }) => (
            <PersonRow
              key={followId}
              p={prof}
              right={
                <Pressable onPress={() => approve(followId)} className="rounded-full px-4 py-1.5" style={{ backgroundColor: ACCENT }}>
                  <Text className="text-sm font-semibold text-white">Approve</Text>
                </Pressable>
              }
            />
          ))}
        </View>
      ) : null}

      {debounced.length >= 2 ? (
        <View className="mt-4">
          <Text className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-content-2">Results</Text>
          {results.length === 0 && !isFetching ? (
            <Text className="px-4 py-6 text-center text-sm text-content-2">No one found for “{debounced}”.</Text>
          ) : (
            results.map((p) => (
              <PersonRow key={p.id} p={p} right={<FollowButton status={statusFor(p.id)} username={p.username} onToggle={() => (statusFor(p.id) ? unfollow(p.id) : follow(p.id))} />} />
            ))
          )}
        </View>
      ) : (
        <Text className="mt-10 px-8 text-center text-sm text-content-2">
          Search for friends by their @username to follow them and see their posts.
        </Text>
      )}
    </ScrollView>
  );
}
