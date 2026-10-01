import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { FollowButton, PersonRow } from '@/components/people';
import { SignInRequired } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { fetchFollowEdges, removeFollower, type FollowStatus } from '@/lib/db/follows';
import { fetchProfileByUsername, profilesByIds } from '@/lib/db/profiles';
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

// Instagram-style Followers / Following lists, yours or anyone's (?user=name):
// tabs across the top, one row per person, FollowButton on the right. Your own
// followers also get Remove.
export default function Follows() {
  const ptr = usePullToRefresh();
  const { tab, user } = useLocalSearchParams<{ tab?: string; user?: string }>();
  const [side, setSide] = useState<Side>(tab === 'following' ? 'following' : 'followers');
  const { session } = useAuth();
  const me = session?.user.id;
  const qc = useQueryClient();
  const { data: myProfile } = useProfile(me ?? '');
  const { data: other } = useQuery({
    queryKey: ['public-profile', user],
    enabled: !!user,
    queryFn: () => fetchProfileByUsername(user!),
  });
  const targetId = user ? other?.id : me;
  const own = !!me && targetId === me;
  const targetName = own ? myProfile?.username : other?.username;
  const { statusFor, follow, unfollow } = useFollows(me);

  const listQuery = (id: string | undefined, s: Side, mine: boolean) => ({
    queryKey: ['follow-list', id, s],
    enabled: !!me && !!id,
    queryFn: async (): Promise<Row[]> => {
      // Your own Following list keeps pending requests so they can be cancelled.
      const edges = (await fetchFollowEdges(id!, s)).filter((e) => mine || e.status === 'approved');
      const profs = await profilesByIds(edges.map((e) => e.userId));
      return edges.filter((e) => profs[e.userId]).map((e) => ({ prof: profs[e.userId], status: e.status }));
    },
  });
  const followersQ = useQuery(listQuery(targetId, 'followers', own));
  const followingQ = useQuery(listQuery(targetId, 'following', own));
  const myFollowersQ = useQuery({ ...listQuery(me, 'followers', true), enabled: !!me && !own });
  const active = side === 'followers' ? followersQ : followingQ;
  const rows = active.data ?? [];

  if (!me) return <SignInRequired message="Sign in to see who follows who." />;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['follow-list'] });
    qc.invalidateQueries({ queryKey: ['profile', me] });
    qc.invalidateQueries({ queryKey: ['public-profile'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const toggle = async (p: Profile) => {
    await (statusFor(p.id) ? unfollow(p.id) : follow(p.id));
    refresh();
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

  const followsMe = (id: string) => (own ? side === 'followers' : !!myFollowersQ.data?.some((r) => r.prof.id === id));

  // Your own tabs count the lists so they never disagree with what's shown;
  // someone else's use their profile counts, since lists you can't see are empty.
  const counts: Record<Side, number> = own
    ? {
        followers: followersQ.data?.length ?? myProfile?.followers_count ?? 0,
        following: followingQ.data ? followingQ.data.filter((r) => r.status === 'approved').length : (myProfile?.following_count ?? 0),
      }
    : { followers: other?.followers_count ?? 0, following: other?.following_count ?? 0 };

  const emptyText = own
    ? side === 'followers'
      ? 'No followers yet. Share your profile to get some.'
      : "You aren't following anyone yet."
    : counts[side] > 0
      ? `Follow @${targetName} to see this list.`
      : side === 'followers'
        ? `@${targetName} has no followers yet.`
        : `@${targetName} isn't following anyone yet.`;

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ title: targetName ? `@${targetName}` : 'Follows' }} />
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

      {active.isLoading ? (
        <ActivityIndicator className="mt-10" color={ACCENT} />
      ) : (
        <FlatList
          refreshControl={ptr.control}
          data={rows}
          keyExtractor={(r) => r.prof.id}
          renderItem={({ item }) => {
            const p = item.prof;
            const status = statusFor(p.id);
            const button =
              p.id === me ? null : (
                <FollowButton status={status} username={p.username} followsYou={followsMe(p.id)} onToggle={() => toggle(p)} />
              );
            return (
              <PersonRow
                p={p}
                onPress={() => router.push({ pathname: '/u/[username]', params: { username: p.username } })}
                right={
                  own && side === 'followers' ? (
                    <View className="flex-row gap-2">
                      {status !== 'approved' ? button : null}
                      <OutlineButton label="Remove" onPress={() => remove(p)} />
                    </View>
                  ) : (
                    button
                  )
                }
              />
            );
          }}
          ListEmptyComponent={<Text className="mt-10 px-8 text-center text-sm text-content-2">{emptyText}</Text>}
        />
      )}
    </View>
  );
}
