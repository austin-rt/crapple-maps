import { Icon } from '@/components/ui';
import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';

import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { ACCENT } from '@/lib/tokens';
import { useColors, useThemePref } from '@/lib/theme';

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

// The map is uncontrolled (initialRegion) so dragging isn't fought by
// re-renders — which also means it ignores later coord changes. Bumping
// `centerKey` animates it to `coords` instead. Bump it ONLY when the location
// is chosen externally (a search pick), never on drag, or the animation would
// fight the gesture.
export function MapPinPicker({
  coords,
  onChange,
  height = 224,
  centerKey,
  zoom = 17,
  flush = false,
}: {
  coords: Coords;
  onChange: (c: Coords) => void;
  height?: number;
  centerKey?: string | number;
  /** Google-style zoom level; converted to a region delta for react-native-maps. */
  zoom?: number;
  /** Drop the default top margin when the caller positions the map itself. */
  flush?: boolean;
}) {
  const c = useColors();
  const { scheme } = useThemePref();
  const mapRef = useRef<any>(null);
  const delta = 360 / 2 ** zoom;

  // Glide to the new spot rather than snapping. Keyed on centerKey alone so a
  // drag (which changes coords) never re-triggers it.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // initialRegion already put us here
    }
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: delta, longitudeDelta: delta },
      600,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

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
    <View className={`overflow-hidden rounded-2xl ${flush ? '' : 'mt-3'}`} style={{ height }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        // Same provider + night style the finder map uses, so the picker
        // doesn't sit bright white inside a dark-mode screen.
        provider={MAP_PROVIDER}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        initialRegion={{ ...coords, latitudeDelta: delta, longitudeDelta: delta }}
        onRegionChangeComplete={(reg: any) => onChange({ latitude: reg.latitude, longitude: reg.longitude })}
      />
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Icon name="location" size={42} color={ACCENT} style={{ marginBottom: 42 }} />
      </View>
    </View>
  );
}
