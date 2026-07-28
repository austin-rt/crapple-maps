// Native map (iOS/Android) — thin wrapper over react-native-maps.
// Metro loads this on native; `map.web.tsx` overrides on web so react-native-maps
// (native-only) never enters the web bundle.
import RNMapView, { Marker, type MapMarkerProps, type Region } from 'react-native-maps';

import { useThemePref } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

export type { Region };
export type AppMapHandle = RNMapView;

export const AppMapView = RNMapView;

// Android's `pinColor` only honors a color's *hue* (rendered full sat/brightness),
// so the muted deep teal collapses to bright cyan and never matches the brand.
// Pre-rendered PNG pins passed via `image` are pixel-exact on both platforms and,
// unlike custom Marker child views, don't trigger the iOS Metal shader crash.
// Two sets: the outline is white on the light map, #1f2023 on the dark map, so
// the pin reads as cut out of whichever basemap is showing (theme-aware).
const PIN_LIGHT: Record<string, ReturnType<typeof require>> = {
  [ACCENT]: require('@/assets/markers/pin-teal.png'), // default
  '#DC2626': require('@/assets/markers/pin-red.png'), // selected
  '#7C3AED': require('@/assets/markers/pin-purple.png'), // visited
};
const PIN_DARK: Record<string, ReturnType<typeof require>> = {
  [ACCENT]: require('@/assets/markers/pin-teal-dark.png'),
  '#DC2626': require('@/assets/markers/pin-red-dark.png'),
  '#7C3AED': require('@/assets/markers/pin-purple-dark.png'),
};

export function AppMarker({ pinColor, ...rest }: MapMarkerProps & { pinColor?: string }) {
  const { scheme } = useThemePref();
  const set = scheme === 'dark' ? PIN_DARK : PIN_LIGHT;
  const image = pinColor ? set[pinColor] : undefined;
  return image ? (
    <Marker {...rest} image={image} anchor={{ x: 0.5, y: 1 }} />
  ) : (
    <Marker {...rest} pinColor={pinColor} />
  );
}
