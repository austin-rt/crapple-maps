import { Text, View } from 'react-native';

import { AMENITY_META, AmenityIcon, type AmenityType } from '@/components/ui';
import { ACCESS } from '@/lib/restrooms/filters';
import type { RestroomInfo } from '@/lib/types';

type Amenities = {
  access_type: string | null;
  accessible: boolean | null;
  unisex: boolean | null;
  changing_table: boolean | null;
};

// Tinted pill per amenity, in that amenity's fixed color (see ui/AmenityIcon).
function AmenityPill({ type }: { type: AmenityType }) {
  const m = AMENITY_META[type];
  return (
    <View className="flex-row items-center gap-1 rounded-full px-3 py-1" style={{ backgroundColor: m.color + '22' }}>
      <AmenityIcon type={type} />
      <Text className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</Text>
    </View>
  );
}

export function AmenityChips({ restroom, info }: { restroom: Amenities; info: RestroomInfo | null | undefined }) {
  const access = restroom.access_type ? ACCESS[restroom.access_type] : null;
  const any =
    access || restroom.accessible || restroom.unisex || restroom.changing_table || info?.purchase_required || info?.requires_code;
  if (!any) return null;
  return (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {access ? (
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: access.color + '22' }}>
          <Text className="text-xs font-semibold" style={{ color: access.color }}>{access.label}</Text>
        </View>
      ) : null}
      {restroom.accessible ? <AmenityPill type="accessible" /> : null}
      {restroom.unisex ? <AmenityPill type="unisex" /> : null}
      {restroom.changing_table ? <AmenityPill type="changing" /> : null}
      {info?.requires_code ? <AmenityPill type="code" /> : null}
      {info?.purchase_required ? <AmenityPill type="purchase" /> : null}
    </View>
  );
}
