import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FollowButton, PersonRow } from '@/components/people';
import { Icon, SignInRequired } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/hooks/useNotifications';
import { markAllRead, type AppNotification, type NotificationKind } from '@/lib/db/notifications';
import { clearBadge } from '@/lib/push';
import { timeAgo } from '@/lib/format';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

function SectionTitle({ children }: { children: string }) {
  return <Text className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-content-2">{children}</Text>;
}

const ACTION: Record<NotificationKind, string> = {
  follow: 'Started following you',
  follow_request: 'Wants to follow you',
  follow_accepted: 'Accepted your follow request',
  like: 'Liked your post',
  comment: 'Commented on your post',
  comment_like: 'Liked your comment',
};

// Follow requests waiting on you (approve / decline), then all other activity,
// newest first. The bell and the Feed tab badge count unread rows.
export default function Notifications() {
  const ptr = usePullToRefresh();
  const { session } = useAuth();
  const me = session?.user.id;
  const c = useColors();
  const qc = useQueryClient();
  const { requests, approve, decline, statusFor, follow, unfollow } = useFollows(me);
  const { data: items = [] } = useNotifications(me);

  // Opening the screen reads everything: the badge clears while the rows still
  // show which ones were new until the next visit.
  useFocusEffect(
    useCallback(() => {
      if (!me) return;
      markAllRead(me)
        .then(() => {
          qc.invalidateQueries({ queryKey: ['notif-unread', me] });
          clearBadge();
        })
        .catch(() => {});
    }, [me, qc]),
  );

  if (!me) return <SignInRequired icon="notifications-outline" message="Sign in to see follows, likes and comments." />;

  const activity = items.filter((n) => n.kind !== 'follow_request');
  const openProfile = (p: Profile) => router.push({ pathname: '/u/[username]', params: { username: p.username } });
  const openItem = (n: AppNotification) =>
    n.logId && (n.kind === 'like' || n.kind === 'comment' || n.kind === 'comment_like')
      ? router.push({ pathname: '/log/[id]', params: { id: n.logId } })
      : openProfile(n.actor);
  const empty = requests.length === 0 && activity.length === 0;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="pb-16" refreshControl={ptr.control}>
      {requests.length > 0 ? (
        <View>
          <SectionTitle>Follow requests</SectionTitle>
          {requests.map(({ followId, prof }) => (
            <PersonRow
              key={followId}
              p={prof}
              onPress={() => openProfile(prof)}
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

      {activity.length > 0 ? (
        <View>
          <SectionTitle>Activity</SectionTitle>
          {activity.map((n) => (
            <View key={n.id} style={n.unread ? { backgroundColor: ACCENT + '14' } : undefined}>
              <PersonRow
                p={n.actor}
                subtitle={`${ACTION[n.kind]} · ${timeAgo(n.createdAt)}`}
                onPress={() => openItem(n)}
                right={
                  n.kind === 'follow' && statusFor(n.actor.id) !== 'approved' ? (
                    <FollowButton
                      status={statusFor(n.actor.id)}
                      username={n.actor.username}
                      followsYou
                      onToggle={() => (statusFor(n.actor.id) ? unfollow(n.actor.id) : follow(n.actor.id))}
                    />
                  ) : null
                }
              />
            </View>
          ))}
        </View>
      ) : null}

      {empty ? (
        <View className="mt-24 items-center px-8">
          <Icon name="notifications-outline" size={40} color={c.content2} />
          <Text className="mt-3 text-center text-base text-content-2">
            No notifications yet. New followers, follow requests, likes and comments show up here.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
