import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar, Stars } from '@/components/ui';
import { useLog } from '@/hooks/useLogs';
import { useResolvedPlace } from '@/hooks/useResolvedPlace';
import { bristol } from '@/lib/bristol';
import { fullWhen } from '@/lib/format';
import { openDirections } from '@/lib/maps';
import { ACCENT, MUTED } from '@/lib/tokens';

const W = Dimensions.get('window').width;

export default function LogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useLog(id);
  const place = useResolvedPlace(data?.lat ?? 0, data?.lng ?? 0, !!data);

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Stack.Screen options={{ title: 'Post' }} />
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  const a = data.author;
  const name = a?.display_name || a?.username || 'Someone';
  const b = bristol(data.bristol_type);

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="pb-16">
      <Stack.Screen options={{ title: 'Post' }} />

      <View className="flex-row items-center gap-3 px-4 pt-4">
        {a?.avatar_url ? (
          <Image source={{ uri: a.avatar_url }} style={{ width: 46, height: 46, borderRadius: 23 }} />
        ) : (
          <Avatar seed={a?.avatar_seed || a?.username || data.user_id} size={46} />
        )}
        <View className="flex-1">
          <Text className="text-base font-bold text-content">{name}</Text>
          <Text className="text-sm text-content-2">@{a?.username ?? 'user'}</Text>
        </View>
        {data.visibility === 'private' ? <Ionicons name="lock-closed" size={16} color={MUTED} /> : null}
      </View>

      {data.caption ? <Text className="px-4 pt-3 text-[19px] leading-7 text-content">{data.caption}</Text> : null}

      {data.photos.length > 0 ? (
        <View className="mt-3 gap-2 px-4">
          {data.photos.map((uri: string, i: number) => (
            <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: W - 32, height: 260, borderRadius: 16 }} contentFit="cover" />
          ))}
        </View>
      ) : null}

      {(data.rating || b) && (
        <View className="mt-4 flex-row items-center gap-3 px-4">
          {data.rating ? <Stars value={data.rating} size={18} gap={2} /> : null}
          {b ? (
            <View className="flex-row items-center gap-1 rounded-full bg-surface-3 px-3 py-1">
              <Text className="text-base">{b.emoji}</Text>
              <Text className="text-xs font-medium text-content-2">{b.label}</Text>
            </View>
          ) : null}
        </View>
      )}

      <Text className="mt-4 px-4 text-sm text-content-2">
        {fullWhen(data.created_at)}
        {place?.full ? ` · ${place.full}` : ''}
      </Text>

      <View className="mx-4 mt-4 h-px bg-line" />

      <Pressable
        onPress={() => router.navigate({ pathname: '/(tabs)', params: { flat: String(data.lat), flng: String(data.lng) } })}
        className="mx-4 mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 active:opacity-80"
        style={{ backgroundColor: ACCENT }}>
        <Ionicons name="map" size={16} color="#fff" />
        <Text className="font-semibold text-white">See on map</Text>
      </Pressable>

      <Pressable
        onPress={() => openDirections(data.lat, data.lng, place?.title || 'Location')}
        className="mx-4 mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-line py-3 active:opacity-70">
        <Ionicons name="navigate" size={16} color={ACCENT} />
        <Text className="font-semibold text-content">Directions</Text>
      </Pressable>
    </ScrollView>
  );
}
