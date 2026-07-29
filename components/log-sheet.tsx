import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

import { Stars } from '@/components/ui';
import { bristol } from '@/lib/bristol';
import { confirmAction } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { softDeleteLog } from '@/lib/db/logs';
import { timeOf } from '@/lib/format';
import { reverseGeocode } from '@/lib/geocode';
import { openDirections } from '@/lib/maps';
import { ACCENT, DANGER } from '@/lib/tokens';
import type { LogItem } from '@/lib/types';
import { useResolvedPlace } from '@/hooks/useResolvedPlace';

export type { LogItem };

function weekdayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function LogSheet({ log, onBack, onDeleted }: { log: LogItem; onBack: () => void; onDeleted: () => void }) {
  const place = useResolvedPlace(log.lat, log.lng, true);
  const b = bristol(log.bristol_type);
  const w = Dimensions.get('window').width;

  const del = () =>
    confirmAction(
      'Delete this log?',
      'It’ll be removed from your map and feed.',
      async () => {
        try {
          await softDeleteLog(log.id);
          onDeleted();
          toast.success('Log deleted');
        } catch (e: any) {
          toast.error("Couldn't delete", e?.message);
        }
      },
      { confirmLabel: 'Delete', destructive: true },
    );

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
        <Text className="mt-4 text-2xl font-bold text-content">
          {place?.title || weekdayDate(log.created_at)}
        </Text>
        <Text className="mt-1 text-sm text-content-2">
          {weekdayDate(log.created_at)} · {timeOf(log.created_at)}
          {place?.full ? ` · ${place.full}` : ''}
          {log.visibility === 'private' ? ' · 🔒 Private' : ' · Friends'}
        </Text>

        {(log.rating || b) && (
          <View className="mt-4 flex-row items-center gap-3">
            {log.rating ? <Stars value={log.rating} size={18} gap={2} /> : null}
            {b ? (
              <View className="flex-row items-center gap-1 rounded-full bg-surface-2 px-3 py-1">
                <Text className="text-base">{b.emoji}</Text>
                <Text className="text-xs font-medium text-content-2">{b.label}</Text>
              </View>
            ) : null}
          </View>
        )}

        {log.caption ? (
          <Text className="mt-3 text-[15px] leading-6 text-content">{log.caption}</Text>
        ) : null}

        <Pressable
          onPress={() => openDirections(log.lat, log.lng, place?.title || 'Log location')}
          className="mt-5 flex-row items-center justify-center gap-2 rounded-xl border border-line py-3 active:opacity-70">
          <Ionicons name="navigate" size={16} color={ACCENT} />
          <Text className="font-semibold text-content">Directions</Text>
        </Pressable>

        <Pressable onPress={del} className="mt-3 flex-row items-center justify-center gap-2 rounded-xl py-3 active:opacity-70">
          <Ionicons name="trash-outline" size={16} color={DANGER} />
          <Text className="font-semibold text-red-600">Delete log</Text>
        </Pressable>
      </View>
    </BottomSheetScrollView>
  );
}
