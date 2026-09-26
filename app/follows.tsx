import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { PersonRow } from '@/components/people';
import { SignInRequired } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { fetchFollowEdges, removeFollower, unfollow, type FollowStatus } from '@/lib/db/follows';
import { profilesByIds } from '@/lib/db/profiles';
import { toast } from '@/lib/toast';
import { ACCENT } from '@/lib/tokens';
import type { Profile } from '@/lib/types';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

type Side = 'followers' | 'following';
type Row = { prof: Profile; status: FollowStatus };

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="rounded-lg bg-surface-3 px-4 py-1.5 active:opacity-70">
      <Text className="text-sm font-semibold text-content">{label}</Text>
    </Pressable>
  );
}

// Instagram-style lists behind the Followers / Following counts on the Profile
// tab: tabs across the top, one row per person, and the action on the right —
// Remove for a follower, Following / Requested to unfollow or cancel.
export default function Follows() {
  const ptr = usePullToRefresh();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [side, setSide] = useState<Side>(tab === 'following' ? 'following' : 'followers');
  const { session } = useAuth();
  const me = session?.user.id;
  const qc = useQueryClient();
  const { data: profile } = useProfile(me ?? '');

  const listQuery = (s: Side) => ({
    queryKey: ['follow-list', me, s],
    enabled: !!me,
    queryFn: async (): Promise<Row[]> => {
      const edges = await fetchFollowEdges(me!, s);
      const profs = await profilesByIds(edges.map((e) => e.userId));
      return edges.filter((e) => profs[e.userId]).map((e) => ({ prof: profs[e.userId], status: e.status }));
    },
  });
  const followersQ = useQuery(listQuery('followers'));
  const followingQ = useQuery(listQuery('following'));
  const active = side === 'followers' ? followersQ : followingQ;
  const rows = active.data;
  const isLoading = active.isLoading;

  if (!me) return <SignInRequired message="Sign in to see who you follow." />;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['follow-list', me] });
    qc.invalidateQueries({ queryKey: ['profile', me] });
    qc.invalidateQueries({ queryKey: ['my-following'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const remove = (p: Profile) =>
    confirmAction(
      'Remove follower?',
      `@${p.username} won't be told they were removed, and won't see your friends-only posts unless they follow you again.`,
      async () => {
        try {
          await removeFollower(me, p.id);
          refresh();
        } catch (e: any) {
          toast.error("Couldn't remove follower", e?.message);
        }
      },
      { confirmLabel: 'Remove', destructive: true },
    );

  const drop = (p: Profile, status: FollowStatus) =>
    confirmAction(
      status === 'pending' ? 'Cancel follow request?' : `Unfollow @${p.username}?`,
      status === 'pending' ? `@${p.username} won't see your request anymore.` : "You'll stop seeing their friends-only posts.",
      async () => {
        try {
          await unfollow(me, p.id);
          refresh();
        } catch (e: any) {
          toast.error("Couldn't unfollow", e?.message);
        }
      },
      { confirmLabel: status === 'pending' ? 'Cancel request' : 'Unfollow', destructive: true },
    );

  // Counted from the lists themselves so the tab labels can never disagree with
  // what's shown (the profile's cached counts lagged behind). Following counts
  // approved follows only; pending requests show in the list as Requested.
  const counts: Record<Side, number> = {
    followers: followersQ.data?.length ?? profile?.followers_count ?? 0,
    following: followingQ.data ? followingQ.data.filter((r) => r.status === 'approved').length : (profile?.following_count ?? 0),
  };

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ title: profile?.username ? `@${profile.username}` : 'Follows' }} />
      <View className="flex-row border-b border-line">
        {(['followers', 'following'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSide(s)}
            accessibilityRole="tab"
            accessibilityState={{ selected: side === s }}
            className="flex-1 items-center py-3"
            style={{ borderBottomWidth: 2, borderBottomColor: side === s ? ACCENT : 'transparent' }}>
            <Text className={`text-sm font-semibold ${side === s ? 'text-content' : 'text-content-2'}`}>
              {counts[s]} {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={ACCENT} />
      ) : (
        <FlatList
          refreshControl={ptr.control}
          data={rows ?? []}
          keyExtractor={(r) => r.prof.id}
          renderItem={({ item }) => (
            <PersonRow
              p={item.prof}
              onPress={() => router.push({ pathname: '/u/[username]', params: { username: item.prof.username } })}
              right={
                side === 'followers' ? (
                  <OutlineButton label="Remove" onPress={() => remove(item.prof)} />
                ) : (
                  <OutlineButton label={item.status === 'pending' ? 'Requested' : 'Following'} onPress={() => drop(item.prof, item.status)} />
                )
              }
            />
          )}
          ListEmptyComponent={
            <Text className="mt-10 px-8 text-center text-sm text-content-2">
              {side === 'followers' ? 'No followers yet. Share your profile to get some.' : "You aren't following anyone yet."}
            </Text>
          }
        />
      )}
    </View>
  );
}
