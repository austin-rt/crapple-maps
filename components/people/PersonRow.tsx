import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import type { Profile } from '@/lib/types';

export function PersonRow({
  p,
  right,
  onPress,
  subtitle,
}: {
  p: Profile;
  right: React.ReactNode;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center gap-3 border-b border-line px-4 py-3 active:opacity-70">
      {p.avatar_url ? (
        <Image source={{ uri: p.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <Avatar seed={p.avatar_seed || p.username} size={44} />
      )}
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-content">{p.display_name || p.username}</Text>
        <Text className="text-sm text-content-2">@{p.username}</Text>
        {subtitle ? <Text className="text-xs text-content-2">{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}
