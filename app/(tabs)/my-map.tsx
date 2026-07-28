import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppMapView, AppMarker, type AppMapHandle, type Region } from '@/components/map';
import { LogSheet, type LogItem } from '@/components/log-sheet';
import { SignInRequired } from '@/components/ui';
import { useMyLogs } from '@/hooks/useLogs';
import { useAuth } from '@/lib/auth';
import { bristol } from '@/lib/bristol';
import { shortWhen } from '@/lib/format';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { ACCENT } from '@/lib/tokens';
import { useThemePref } from '@/lib/theme';

const DEFAULT_REGION: Region = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.08, longitudeDelta: 0.08 };

function regionFor(logs: LogItem[]): Region {
  if (!logs.length) return DEFAULT_REGION;
  const lats = logs.map((l) => l.lat);
  const lngs = logs.map((l) => l.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
  };
}

export default function MyMapScreen() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePref();
  const sheetBg = scheme === 'dark' ? '#0a0a0c' : '#ffffff';
  const mapRef = useRef<AppMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const [selected, setSelected] = useState<LogItem | null>(null);
  const [tab, setTab] = useState<'list' | 'gallery'>('list');

  const { data: logs = [] } = useMyLogs(session?.user.id);

  useEffect(() => {
    if (logs.length && mapRef.current) mapRef.current.animateToRegion(regionFor(logs), 500);
  }, [logs.length]);

  const select = (log: LogItem) => {
    setSelected(log);
    mapRef.current?.animateToRegion({ latitude: log.lat, longitude: log.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    sheetRef.current?.snapToIndex(0); // peek — map stays dominant
  };

  const onDeleted = () => {
    setSelected(null);
    qc.invalidateQueries({ queryKey: ['my-logs'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  if (!session) {
    return <SignInRequired icon="trail-sign-outline" message="Everywhere you’ve gone, mapped." />;
  }

  const gallery = logs.flatMap((l) => l.photos.map((url) => ({ url, log: l })));

  return (
    <View className="flex-1 bg-surface">
      <AppMapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        onPress={() => setSelected(null)}
        initialRegion={DEFAULT_REGION}>
        {logs.map((l) => (
          <AppMarker
            key={l.id}
            coordinate={{ latitude: l.lat, longitude: l.lng }}
            pinColor={l.id === selected?.id ? '#DC2626' : ACCENT}
            onPress={() => select(l)}
          />
        ))}
      </AppMapView>

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={['30%', '58%', '92%']}
        backgroundStyle={{ backgroundColor: sheetBg }}
        handleIndicatorStyle={{ backgroundColor: '#9CA3AF' }}>
        {selected ? (
          <LogSheet
            log={selected}
            onBack={() => {
              setSelected(null);
              sheetRef.current?.snapToIndex(1);
            }}
            onDeleted={onDeleted}
          />
        ) : logs.length === 0 ? (
          <View className="mt-16 items-center px-8">
            <Text className="text-5xl">🚽</Text>
            <Text className="mt-4 text-center text-lg font-semibold text-content">Nothing logged yet</Text>
            <Text className="mt-1 text-center text-sm text-content-2">
              Hit the Log tab to drop your first pin — it’ll show up here.
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/compose')} className="mt-5 rounded-xl px-5 py-3" style={{ backgroundColor: ACCENT }}>
              <Text className="font-semibold text-white">Log a visit</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="px-5 pb-3">
              <Text className="text-base font-semibold text-content">
                {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              </Text>
              <View className="mt-2 flex-row gap-2">
                {(['list', 'gallery'] as const).map((t) => {
                  const on = tab === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTab(t)}
                      className={`flex-row items-center gap-1.5 rounded-full px-4 py-1.5 ${on ? '' : 'border border-line'}`}
                      style={on ? { backgroundColor: ACCENT } : undefined}>
                      <Ionicons name={t === 'list' ? 'list' : 'grid'} size={14} color={on ? '#fff' : '#9CA3AF'} />
                      <Text className={on ? 'text-sm font-semibold text-white' : 'text-sm text-content-2'}>
                        {t === 'list' ? 'List' : 'Gallery'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {tab === 'list' ? (
              <BottomSheetFlatList
                data={logs}
                keyExtractor={(i, idx) => (i as LogItem).id + idx}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
                renderItem={({ item }) => {
                  const l = item as LogItem;
                  const b = bristol(l.bristol_type);
                  return (
                    <Pressable
                      onPress={() => select(l)}
                      className="flex-row items-center gap-3 rounded-2xl border border-line p-3 active:opacity-70">
                      {l.photos[0] ? (
                        <Image source={{ uri: l.photos[0] }} style={{ width: 52, height: 52, borderRadius: 10 }} />
                      ) : (
                        <View className="h-[52px] w-[52px] items-center justify-center rounded-[10px]" style={{ backgroundColor: ACCENT + '22' }}>
                          <Text className="text-xl">{b?.emoji ?? '🚽'}</Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text numberOfLines={1} className="text-[15px] font-semibold text-content">
                          {l.caption || (b ? `${b.emoji} ${b.label}` : 'A quiet moment')}
                        </Text>
                        <View className="mt-0.5 flex-row items-center gap-2">
                          {l.rating ? <Text className="text-xs" style={{ color: ACCENT }}>{'★'.repeat(l.rating)}</Text> : null}
                          <Text className="text-xs text-content-2">{shortWhen(l.created_at)}</Text>
                          {l.photos.length ? <Text className="text-xs text-content-2">· 📷 {l.photos.length}</Text> : null}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </Pressable>
                  );
                }}
              />
            ) : gallery.length ? (
              <BottomSheetFlatList
                data={gallery}
                keyExtractor={(i, idx) => (i as any).url + idx}
                numColumns={3}
                contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: insets.bottom + 24 }}
                renderItem={({ item }) => {
                  const g = item as { url: string; log: LogItem };
                  return (
                    <Pressable onPress={() => select(g.log)} style={{ width: '33.33%', aspectRatio: 1, padding: 2 }}>
                      <Image source={{ uri: g.url }} style={{ flex: 1, borderRadius: 8 }} contentFit="cover" />
                    </Pressable>
                  );
                }}
              />
            ) : (
              <View className="mt-10 items-center px-8">
                <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                <Text className="mt-2 text-center text-sm text-content-2">No photos yet. Add some when you log.</Text>
              </View>
            )}
          </>
        )}
      </BottomSheet>
    </View>
  );
}
