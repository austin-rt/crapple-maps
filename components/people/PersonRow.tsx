import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import type { Profile } from '@/lib/types';

export function PersonRow({ p, right }: { p: Profile; right: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
      {p.avatar_url ? (
        <Image source={{ uri: p.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <Avatar seed={p.avatar_seed || p.username} size={44} />
      )}
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-content">{p.display_name || p.username}</Text>
        <Text className="text-sm text-content-2">@{p.username}</Text>
      </View>
      {right}
    </View>
  );
}
