import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { LogMap } from '@/components/LogMap';
import { FollowButton } from '@/components/people';
import { Icon, SignInRequired } from '@/components/ui';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/lib/auth';
import { fetchProfileByUsername } from '@/lib/db/profiles';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// Someone's map, opened from their profile. Logs are friends-only, so the map
// shows once you're an approved follower; until then it says so.
export default function UserMap() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const c = useColors();
  const { statusFor, follow, unfollow } = useFollows(me);
  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    enabled: !!username,
    queryFn: () => fetchProfileByUsername(username!),
  });

  const title = profile ? `@${profile.username}` : 'Map';
  if (!me) return <SignInRequired icon="trail-sign-outline" message="Sign in to see where your friends go." />;
  if (isLoading || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Stack.Screen options={{ title }} />
        {isLoading ? <ActivityIndicator color={ACCENT} /> : <Text className="text-content-2">No one goes by @{username}.</Text>}
      </View>
    );
  }

  const isMe = profile.id === me;
  const status = statusFor(profile.id);
  if (!isMe && status !== 'approved') {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Stack.Screen options={{ title }} />
        <Icon name="lock-closed-outline" size={40} color={c.content2} />
        <Text className="mb-5 mt-3 text-center text-base text-content-2">
          {status === 'pending'
            ? `Your follow request is waiting on @${profile.username}. Their map shows once they approve it.`
            : `Follow @${profile.username} to see their map.`}
        </Text>
        <FollowButton status={status} username={profile.username} onToggle={() => (status ? unfollow(profile.id) : follow(profile.id))} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <LogMap userId={profile.id} own={isMe} />
    </>
  );
}
