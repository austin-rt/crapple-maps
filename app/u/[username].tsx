import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import { FollowButton } from '@/components/people';
import { Avatar, Icon } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { useAuth } from '@/lib/auth';
import { fetchProfileByUsername } from '@/lib/db/profiles';
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

export default function SharedProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const c = useColors();
  const isMobileWeb = useIsMobileWeb();
  const { statusFor, follow, unfollow } = useFollows(me);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    enabled: !!username,
    queryFn: () => fetchProfileByUsername(username!),
  });

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

  const isMe = profile.id === me;
  const status = statusFor(profile.id);

  return (
    <View className="flex-1 items-center bg-surface px-6 pt-10">
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <View className="w-full max-w-[420px] items-center">
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 96, height: 96, borderRadius: 48 }} className="bg-surface-3" />
        ) : (
          <Avatar seed={profile.avatar_seed || profile.username} size={96} />
        )}
        <Text className="mt-4 text-2xl font-bold text-content">{profile.display_name || profile.username}</Text>
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
            <FollowButton status={status} onToggle={() => (status ? unfollow(profile.id) : follow(profile.id))} />
          ) : (
            <Pressable
              onPress={() => router.navigate('/(tabs)/profile')}
              accessibilityRole="button"
              className="rounded-full px-5 py-2.5 active:opacity-80"
              style={{ backgroundColor: ACCENT }}>
              <Text className="font-semibold text-white">Sign in to follow</Text>
            </Pressable>
          )}
        </View>

        {!isMe && status === 'pending' ? (
          <Text className="mt-3 text-center text-sm text-content-2">
            Request sent. You’ll see their posts once they approve it.
          </Text>
        ) : null}

        {isMobileWeb ? (
          <Pressable
            onPress={() => Linking.openURL(`crapplemaps://u/${encodeURIComponent(profile.username)}`)}
            accessibilityRole="link"
            className="mt-8 flex-row items-center gap-2 rounded-full border border-line px-5 py-2.5 active:opacity-70">
            <Icon name="phone-portrait-outline" size={16} color={c.content2} />
            <Text className="font-semibold text-content">Open in the app</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
