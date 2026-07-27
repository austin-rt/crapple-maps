import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

import { ACCENT } from '@/lib/auth';
import { bristol } from '@/lib/bristol';
import { reverseGeocode, type Place } from '@/lib/geocode';
import { openDirections } from '@/lib/maps';
import { supabase } from '@/lib/supabase';

export type LogItem = {
  id: string;
  lat: number;
  lng: number;
  rating: number | null;
  bristol_type: number | null;
  caption: string | null;
  visibility: 'friends' | 'private';
  created_at: string;
  photos: string[];
};

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function Stars({ value }: { value: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= value ? 'star' : 'star-outline'} size={18} color={n <= value ? ACCENT : '#D1D5DB'} />
      ))}
    </View>
  );
}

export function LogSheet({ log, onBack, onDeleted }: { log: LogItem; onBack: () => void; onDeleted: () => void }) {
  const [place, setPlace] = useState<Place | null>(null);
  const b = bristol(log.bristol_type);
  const w = Dimensions.get('window').width;

  useEffect(() => {
    let on = true;
    setPlace(null);
    reverseGeocode(log.lat, log.lng, true).then((p) => on && setPlace(p));
    return () => {
      on = false;
    };
  }, [log.id, log.lat, log.lng]);

  const del = () =>
    Alert.alert('Delete this log?', 'It’ll be removed from your map and feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('logs').update({ deleted_at: new Date().toISOString() }).eq('id', log.id);
          onDeleted();
        },
      },
    ]);

  return (
    <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} hitSlop={8} className="mb-3 ml-5 flex-row items-center gap-1 self-start">
        <Ionicons name="chevron-back" size={18} color={ACCENT} />
        <Text className="text-sm font-semibold" style={{ color: ACCENT }}>All logs</Text>
      </Pressable>

      {log.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {log.photos.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={{ width: log.photos.length === 1 ? w - 40 : w * 0.7, height: 220, borderRadius: 16 }}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      <View className="px-5">
        <Text className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {place?.title || when(log.created_at)}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {when(log.created_at)} · {timeOf(log.created_at)}
          {place?.full ? ` · ${place.full}` : ''}
          {log.visibility === 'private' ? ' · 🔒 Private' : ' · Friends'}
        </Text>

        {(log.rating || b) && (
          <View className="mt-4 flex-row items-center gap-3">
            {log.rating ? <Stars value={log.rating} /> : null}
            {b ? (
              <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                <Text className="text-base">{b.emoji}</Text>
                <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{b.label}</Text>
              </View>
            ) : null}
          </View>
        )}

        {log.caption ? (
          <Text className="mt-3 text-[15px] leading-6 text-neutral-800 dark:text-neutral-200">{log.caption}</Text>
        ) : null}

        <Pressable
          onPress={() => openDirections(log.lat, log.lng, place?.title || 'Log location')}
          className="mt-5 flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 py-3 active:opacity-70 dark:border-neutral-700">
          <Ionicons name="navigate" size={16} color={ACCENT} />
          <Text className="font-semibold text-neutral-800 dark:text-neutral-100">Directions</Text>
        </Pressable>

        <Pressable onPress={del} className="mt-3 flex-row items-center justify-center gap-2 rounded-xl py-3 active:opacity-70">
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
          <Text className="font-semibold text-red-600">Delete log</Text>
        </Pressable>
      </View>
    </BottomSheetScrollView>
  );
}
