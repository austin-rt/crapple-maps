import { Text, View } from 'react-native';

import { InfoRow } from '@/components/ui';
import type { Place } from '@/lib/geocode';
import type { RestroomInfo } from '@/lib/types';

const line = 'text-[15px] leading-5 text-content-2';

export function InfoSection({ place, info }: { place: Place | null; info: RestroomInfo | null | undefined }) {
  return (
    <View className="mt-3 border-t border-neutral-100 pt-1 dark:border-neutral-800">
      <InfoRow icon="location-outline">
        <Text className={line}>{place?.full || 'Locating…'}</Text>
      </InfoRow>
      {info?.hours ? (
        <InfoRow icon="time-outline">
          <Text className={line}>{info.hours}</Text>
        </InfoRow>
      ) : null}
      {info?.description ? (
        <InfoRow icon="information-circle-outline">
          <Text className={line}>{info.description}</Text>
        </InfoRow>
      ) : null}
    </View>
  );
}
