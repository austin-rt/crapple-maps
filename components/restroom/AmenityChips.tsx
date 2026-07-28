import { Text, View } from 'react-native';

import { Chip } from '@/components/ui';
import { ACCESS } from '@/lib/restrooms/filters';
import type { RestroomInfo } from '@/lib/types';

type Amenities = {
  access_type: string | null;
  accessible: boolean | null;
  unisex: boolean | null;
  changing_table: boolean | null;
};

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
      {restroom.accessible ? <Chip icon="accessibility" label="Accessible" /> : null}
      {restroom.unisex ? <Chip icon="male-female" label="Unisex" /> : null}
      {restroom.changing_table ? <Chip icon="body" label="Changing table" /> : null}
      {info?.requires_code ? <Chip icon="keypad-outline" label="Code required" /> : null}
      {info?.purchase_required ? <Chip icon="card-outline" label="Purchase required" /> : null}
    </View>
  );
}
