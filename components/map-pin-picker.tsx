import { Icon } from '@/components/ui';
import Constants from 'expo-constants';
import { Platform, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// Uber/Lyft-style precise pin: a fixed pin sits at screen center and the map
// pans under it — wherever the map settles is the chosen point.
// Native map only; Expo Go / web fall back to the coarse coords from search.
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let MapView: any = null;
let mapsAvailable = false;
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    MapView = require('react-native-maps').default;
    mapsAvailable = !!MapView;
  } catch {
    mapsAvailable = false;
  }
}

type Coords = { latitude: number; longitude: number };

// `centerKey` remounts the map so it re-centers on `coords`. The map is
// uncontrolled (initialRegion) so that dragging isn't fought by re-renders —
// which also means it ignores later coord changes. Bump this ONLY when the
// location is chosen externally (a search pick), never on drag.
export function MapPinPicker({
  coords,
  onChange,
  height = 224,
  centerKey,
}: {
  coords: Coords;
  onChange: (c: Coords) => void;
  height?: number;
  centerKey?: string | number;
}) {
  const c = useColors();
  if (!mapsAvailable) {
    return (
      <View className="mt-3 items-center rounded-xl border border-dashed border-line p-4">
        <Icon name="map-outline" size={22} color={c.content2} />
        <Text className="mt-1 text-center text-xs text-content-2">
          Drag-a-pin map appears in the dev build. Using the selected location.
        </Text>
      </View>
    );
  }
  return (
    <View className="mt-3 overflow-hidden rounded-2xl" style={{ height }}>
      <MapView
        key={centerKey}
        style={{ flex: 1 }}
        initialRegion={{ ...coords, latitudeDelta: 0.003, longitudeDelta: 0.003 }}
        onRegionChangeComplete={(reg: any) => onChange({ latitude: reg.latitude, longitude: reg.longitude })}
      />
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Icon name="location" size={42} color={ACCENT} style={{ marginBottom: 42 }} />
      </View>
    </View>
  );
}
