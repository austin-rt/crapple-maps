import { APIProvider, Map as GMap, Marker as GMarker } from '@vis.gl/react-google-maps';
import { View } from 'react-native';

import { DARK_MAP_STYLE } from '@/lib/maps';
import { useThemePref } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

type Coords = { latitude: number; longitude: number };

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY ?? '';

// Standard teardrop pin in the brand color (data-URI — avoids google.maps
// constructors, which aren't ready when this map first mounts).
const PIN_ICON =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">` +
      `<path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${ACCENT}" stroke="#ffffff" stroke-width="1.5"/>` +
      `<circle cx="14" cy="14" r="5" fill="#ffffff"/></svg>`,
  );

// See the native picker: `centerKey` remounts the map to re-center it after an
// external location pick. The marker itself is controlled, so drags are live.
export function MapPinPicker({
  coords,
  onChange,
  height = 200,
  centerKey,
  zoom = 16,
  flush = false,
}: {
  coords: Coords;
  onChange: (c: Coords) => void;
  height?: number;
  centerKey?: string | number;
  zoom?: number;
  flush?: boolean;
}) {
  const { scheme } = useThemePref();
  return (
    <View
      className={`overflow-hidden rounded-2xl border border-line ${flush ? '' : 'mt-3'}`}
      style={{ height }}>
      <APIProvider apiKey={KEY}>
        <GMap
          key={centerKey}
          defaultCenter={{ lat: coords.latitude, lng: coords.longitude }}
          defaultZoom={zoom}
          styles={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          onClick={(e: any) => {
            const ll = e?.detail?.latLng;
            if (ll) onChange({ latitude: ll.lat, longitude: ll.lng });
          }}
          style={{ width: '100%', height: '100%' }}>
          <GMarker
            position={{ lat: coords.latitude, lng: coords.longitude }}
            draggable
            icon={PIN_ICON}
            onDragEnd={(e: any) => {
              const ll = e?.latLng;
              if (ll) onChange({ latitude: ll.lat(), longitude: ll.lng() });
            }}
          />
        </GMap>
      </APIProvider>
    </View>
  );
}
