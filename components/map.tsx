// Native map (iOS/Android) — thin re-export of react-native-maps.
// Metro loads this on native; `map.web.tsx` overrides on web so react-native-maps
// (native-only) never enters the web bundle.
import RNMapView, { Marker, type Region } from 'react-native-maps';

export type { Region };
export type AppMapHandle = RNMapView;

export const AppMapView = RNMapView;
export const AppMarker = Marker;
