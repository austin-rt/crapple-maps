import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MarkerBadge } from '@/components/ui';
import { openDirections } from '@/lib/maps';
import { ACCESS, distLabel } from '@/lib/restrooms/filters';
import { ACCENT, MUTED } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// A finder list card. Resolves a real title for generic/unnamed restrooms via
// the parent's `onResolve` (throttled + cached upstream).
export function PlaceCard({
  item,
  title,
  active,
  saved,
  onSelect,
  onResolve,
}: {
  item: Restroom;
  title: string;
  active: boolean;
  saved?: boolean;
  onSelect: () => void;
  onResolve: (item: Restroom) => void;
}) {
  useEffect(() => {
    onResolve(item);
  }, [item.id]);

  const a = item.access_type ? ACCESS[item.access_type] : null;
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-70 ${active ? 'border-2' : 'border-neutral-200 dark:border-neutral-800'}`}
      style={active ? { borderColor: ACCENT } : undefined}>
      <MarkerBadge size={40} />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text numberOfLines={1} className="flex-shrink text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
          {saved ? <Ionicons name="bookmark" size={13} color={ACCENT} /> : null}
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          {item.avg_rating != null ? (
            <Text className="text-xs font-semibold" style={{ color: ACCENT }}>★ {Number(item.avg_rating).toFixed(1)}</Text>
          ) : null}
          {a ? <Text className="text-xs font-medium" style={{ color: a.color }}>{a.label}</Text> : null}
          {item.accessible ? <Ionicons name="accessibility" size={13} color={MUTED} /> : null}
          {item.unisex ? <Ionicons name="male-female" size={13} color={MUTED} /> : null}
          {item.changing_table ? <Ionicons name="body" size={13} color={MUTED} /> : null}
          {item.log_count ? <Text className="text-xs text-neutral-400">· 📍 {item.log_count}</Text> : null}
          {distLabel(item.dist) ? <Text className="text-xs text-neutral-400">· {distLabel(item.dist)}</Text> : null}
        </View>
      </View>
      <Pressable
        hitSlop={8}
        onPress={() => openDirections(item.lat, item.lng, title)}
        className="items-center justify-center rounded-full px-3 py-2"
        style={{ backgroundColor: ACCENT + '18' }}>
        <Ionicons name="navigate" size={18} color={ACCENT} />
      </Pressable>
    </Pressable>
  );
}
