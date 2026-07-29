import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { PlaceCard } from '@/components/finder';
import { MarkerBadge, SignInRequired } from '@/components/ui';
import { useSavedList } from '@/hooks/useSaved';
import { useAuth } from '@/lib/auth';
import { bestTitle, isGenericName, reverseGeocode } from '@/lib/geocode';
import { ACCENT } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

export default function SavedScreen() {
  const { session } = useAuth();
  const { data: list = [], isLoading } = useSavedList(session?.user.id);
  const [titles, setTitles] = useState<Record<string, string>>({});

  const resolveTitle = useCallback((item: Restroom) => {
    if (!isGenericName(item.name)) return;
    reverseGeocode(item.lat, item.lng).then((p) => {
      if (p?.title) setTitles((t) => (t[item.id] ? t : { ...t, [item.id]: p.title }));
    });
  }, []);
  const titleFor = (item: Restroom) => bestTitle(item.name, titles[item.id] ? { title: titles[item.id], full: '' } : null);

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: 'Saved' }} />
        <SignInRequired icon="bookmark-outline" message="Save the restrooms you rely on." />
      </>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ title: 'Saved restrooms' }} />
      <FlatList
        data={list as Restroom[]}
        keyExtractor={(i) => (i as Restroom).id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const it = item as Restroom;
          return (
            <PlaceCard
              item={it}
              title={titleFor(it)}
              active={false}
              saved
              onSelect={() => router.navigate({ pathname: '/(tabs)', params: { flat: String(it.lat), flng: String(it.lng) } })}
              onResolve={resolveTitle}
            />
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 64 }} color={ACCENT} />
          ) : (
            <View className="mt-24 items-center px-8">
              <MarkerBadge size={64} />
              <Text className="mt-4 text-center text-lg font-semibold text-content">No saved restrooms yet</Text>
              <Text className="mt-1 text-center text-sm text-content-2">Tap Save on any restroom to keep it here.</Text>
            </View>
          )
        }
      />
    </View>
  );
}
