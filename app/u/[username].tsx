import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { FollowButton } from '@/components/people';
import { AgeGate, AuthForm, useAgePassed } from '@/components/profile';
import { Avatar, Icon } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAuth } from '@/lib/auth';
import { fetchProfileByUsername, type PublicProfile } from '@/lib/db/profiles';
import { shareProfile } from '@/lib/share';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-lg font-bold text-content">{value}</Text>
      <Text className="text-xs text-content-2">{label}</Text>
    </View>
  );
}

function ProfileAvatar({ p, size }: { p: PublicProfile; size: number }) {
  return p.avatar_url ? (
    <Image source={{ uri: p.avatar_url }} style={{ width: size, height: size, borderRadius: size / 2 }} className="bg-surface-3" />
  ) : (
    <Avatar seed={p.avatar_seed || p.username} size={size} />
  );
}

// Landing page for a shared profile link. Everyone sees the profile; an invite
// link (?invite=1) sends the follow request on arrival once the visitor is
// signed in. A signed-out visitor taps Sign in to follow and signs in right
// here, so the request goes out without leaving the page.
export default function SharedProfile() {
  const ptr = usePullToRefresh();
  const { username, invite } = useLocalSearchParams<{ username: string; invite?: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const c = useColors();
  const [agePassed, setAgePassed] = useAgePassed();
  const { statusFor, followingLoaded, follow, unfollow } = useFollows(me);
  const autoSent = useRef(false);
  const [showAuth, setShowAuth] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    enabled: !!username,
    queryFn: () => fetchProfileByUsername(username!),
  });

  const isMe = !!profile && profile.id === me;
  const status = profile ? statusFor(profile.id) : undefined;

  useEffect(() => {
    if (invite !== '1' || autoSent.current || !me || !profile || isMe || !followingLoaded || status) return;
    autoSent.current = true;
    follow(profile.id);
  }, [invite, me, profile, isMe, followingLoaded, status, follow]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Stack.Screen options={{ title: 'Profile' }} />
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Stack.Screen options={{ title: 'Profile' }} />
        <Icon name="people-outline" size={40} color={c.content2} />
        <Text className="mt-3 text-center text-lg text-content-2">No one goes by @{username}.</Text>
      </View>
    );
  }

  const name = profile.display_name || profile.username;

  if (!me && showAuth) {
    return (
      <View className="flex-1 bg-surface">
        <Stack.Screen options={{ title: `@${profile.username}` }} />
        <View className="flex-row items-center gap-3 border-b border-line px-5 py-4">
          <ProfileAvatar p={profile} size={48} />
          <View className="flex-1">
            <Text className="text-base font-semibold text-content">{invite === '1' ? `${name} invited you to follow them` : `Sign in to follow ${name}`}</Text>
            <Text className="text-sm text-content-2">@{profile.username}</Text>
          </View>
        </View>
        {agePassed === null ? null : !agePassed ? (
          <AgeGate onPass={() => setAgePassed(true)} />
        ) : (
          <AuthForm subtitle={`Sign in to follow ${name}. The request goes out as soon as you're in.`} />
        )}
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="items-center px-6 pb-16 pt-10" refreshControl={ptr.control}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <View className="w-full max-w-[420px] items-center">
        <ProfileAvatar p={profile} size={96} />
        <Text className="mt-4 text-2xl font-bold text-content">{name}</Text>
        <Text className="text-sm text-content-2">@{profile.username}</Text>

        <View className="mt-6 w-full flex-row rounded-2xl border border-line py-4">
          <Stat label="Followers" value={profile.followers_count ?? 0} />
          <View className="w-px bg-surface-3" />
          <Stat label="Following" value={profile.following_count ?? 0} />
        </View>

        <View className="mt-6 items-center">
          {isMe ? (
            <Pressable
              onPress={() => shareProfile(profile.username)}
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-full px-5 py-2.5 active:opacity-80"
              style={{ backgroundColor: ACCENT }}>
              <Icon name="share-outline" size={16} color="#fff" />
              <Text className="font-semibold text-white">Share profile</Text>
            </Pressable>
          ) : me ? (
            <FollowButton status={status} username={profile.username} onToggle={() => (status ? unfollow(profile.id) : follow(profile.id))} />
          ) : (
            <Pressable
              onPress={() => setShowAuth(true)}
              accessibilityRole="button"
              className="rounded-full px-5 py-2.5 active:opacity-80"
              style={{ backgroundColor: ACCENT }}>
              <Text className="font-semibold text-white">Sign in to follow</Text>
            </Pressable>
          )}
        </View>

        {!isMe && status === 'pending' ? (
          <Text className="mt-3 text-center text-sm text-content-2">
            Follow request sent. You’ll see {name}’s posts once they approve it.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
