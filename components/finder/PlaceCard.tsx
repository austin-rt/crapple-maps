import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AmenityIcon, MarkerBadge } from '@/components/ui';
import { peekPlace, reverseGeocode } from '@/lib/geocode';
import { isOpenNow } from '@/lib/hours';
import { openDirections } from '@/lib/maps';
import { ACCESS, distLabel } from '@/lib/restrooms/filters';
import { ACCENT, DANGER, OPEN } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// Full-width list row (Google-Maps style): no card outline, hairline divider.
// Resolves a real title for generic/unnamed restrooms via the parent's
// `onResolve` (throttled + cached upstream); the address line self-resolves
// from the shared geocode cache since the DB rarely has one stored.
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
  const [address, setAddress] = useState<string | null>(
    item.address || peekPlace(item.lat, item.lng)?.full || null
  );
  useEffect(() => {
    onResolve(item);
    if (!item.address) {
      reverseGeocode(item.lat, item.lng).then((p) => {
        if (p?.full) setAddress((a) => a ?? p.full);
      });
    }
  }, [item.id]);

  const a = item.access_type ? ACCESS[item.access_type] : null;
  const open = isOpenNow(item.hours);
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-surface-2 ${active ? 'bg-surface-2' : ''}`}>
      <MarkerBadge size={40} />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text numberOfLines={1} className="flex-shrink text-base font-semibold text-content">{title}</Text>
          {saved ? <Ionicons name="bookmark" size={13} color={ACCENT} /> : null}
        </View>
        {address ? (
          <Text numberOfLines={1} className="mt-0.5 text-sm text-content-2">{address}</Text>
        ) : null}
        <View className="mt-0.5 flex-row items-center gap-1.5">
          {open != null ? (
            <Text className="text-xs font-semibold" style={{ color: open ? OPEN : DANGER }}>{open ? 'Open' : 'Closed'}</Text>
          ) : null}
          {open != null && a ? <Text className="text-xs text-content-2">·</Text> : null}
          {a ? <Text className="text-xs font-medium" style={{ color: a.color }}>{a.label}</Text> : null}
          {item.accessible ? <AmenityIcon type="accessible" /> : null}
          {item.unisex ? <AmenityIcon type="unisex" /> : null}
          {item.changing_table ? <AmenityIcon type="changing" /> : null}
          {item.requires_code ? <AmenityIcon type="code" /> : null}
          {item.purchase_required ? <AmenityIcon type="purchase" /> : null}
          {distLabel(item.dist) ? <Text className="text-xs text-content-2">· {distLabel(item.dist)}</Text> : null}
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
