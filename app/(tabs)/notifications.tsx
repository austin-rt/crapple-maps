import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FollowButton, PersonRow } from '@/components/people';
import { Icon, SignInRequired } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAuth } from '@/lib/auth';
import { fetchFollowEdges } from '@/lib/db/follows';
import { profilesByIds } from '@/lib/db/profiles';
import { timeAgo } from '@/lib/format';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

function SectionTitle({ children }: { children: string }) {
  return <Text className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-content-2">{children}</Text>;
}

// Follow requests waiting on you (approve / decline) and your newest followers,
// newest first. The tab's badge counts the pending requests.
export default function Notifications() {
  const ptr = usePullToRefresh();
  const { session } = useAuth();
  const me = session?.user.id;
  const c = useColors();
  const { requests, approve, decline, statusFor, follow, unfollow } = useFollows(me);

  const { data: followers = [] } = useQuery({
    queryKey: ['recent-followers', me],
    enabled: !!me,
    queryFn: async (): Promise<{ prof: Profile; createdAt: string }[]> => {
      const edges = (await fetchFollowEdges(me!, 'followers')).slice(0, 30);
      const profs = await profilesByIds(edges.map((e) => e.userId));
      return edges.filter((e) => profs[e.userId]).map((e) => ({ prof: profs[e.userId], createdAt: e.createdAt }));
    },
  });

  if (!me) return <SignInRequired icon="notifications-outline" message="Sign in to see follow requests and new followers." />;

  const open = (p: Profile) => router.push({ pathname: '/u/[username]', params: { username: p.username } });
  const empty = requests.length === 0 && followers.length === 0;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="pb-16" refreshControl={ptr.control}>
      {requests.length > 0 ? (
        <View>
          <SectionTitle>Follow requests</SectionTitle>
          {requests.map(({ followId, prof }) => (
            <PersonRow
              key={followId}
              p={prof}
              onPress={() => open(prof)}
              right={
                <View className="flex-row gap-2">
                  <Pressable onPress={() => approve(followId)} accessibilityRole="button" className="rounded-lg px-3 py-1.5" style={{ backgroundColor: ACCENT }}>
                    <Text className="text-sm font-semibold text-white">Approve</Text>
                  </Pressable>
                  <Pressable onPress={() => decline(prof.id)} accessibilityRole="button" className="rounded-lg bg-surface-3 px-3 py-1.5">
                    <Text className="text-sm font-semibold text-content">Decline</Text>
                  </Pressable>
                </View>
              }
            />
          ))}
        </View>
      ) : null}

      {followers.length > 0 ? (
        <View>
          <SectionTitle>New followers</SectionTitle>
          {followers.map(({ prof, createdAt }) => (
            <PersonRow
              key={prof.id}
              p={prof}
              subtitle={`Started following you · ${timeAgo(createdAt)}`}
              onPress={() => open(prof)}
              right={
                statusFor(prof.id) ? null : (
                  <FollowButton status={undefined} username={prof.username} onToggle={() => follow(prof.id)} />
                )
              }
            />
          ))}
        </View>
      ) : null}

      {empty ? (
        <View className="mt-24 items-center px-8">
          <Icon name="notifications-outline" size={40} color={c.content2} />
          <Text className="mt-3 text-center text-base text-content-2">No notifications yet. Follow requests and new followers show up here.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
