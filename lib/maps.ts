import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

// Map tile provider. 'google' === PROVIDER_GOOGLE, undefined === PROVIDER_DEFAULT.
// Kept as a plain string so this module never imports react-native-maps (which is
// native-only and breaks the web bundle). The native map wrapper applies it.
//
// Google Maps is the app's primary provider and ships in production on every
// platform. But the Google native renderer is unusable on simulators: the iOS
// Simulator crashes in the Google Maps OpenGL shader compiler (Apple Silicon),
// and the Android emulator can't rasterize custom map styles. So in development
// on iOS we fall back to the platform default (Apple Maps — Metal-based, renders
// reliably on the simulator and does dark mode natively) to keep the app
// testable. Production, and Android, always use Google.
export const MAP_PROVIDER: 'google' | undefined = __DEV__ && Platform.OS === 'ios' ? undefined : 'google';

// Google "night" map style, applied when the app is in dark mode so the map
// tiles match the theme. Pass to <MapView customMapStyle={...}> (Google only).
// Google's canonical "night" style — the recognizable Google Maps dark look:
// blue-gray land, dark-blue water, dark-green parks, and the characteristic warm
// tan major roads (the color differentiation our old flat style was missing).
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// Open a destination in the user's maps app of choice (Apple / Google / Waze).
// Uses universal https/scheme URLs so each opens its native app when installed,
// falling back to the browser otherwise.
export function openDirections(lat: number, lng: number, label?: string) {
  const q = encodeURIComponent(label || 'Restroom');
  const targets: { name: string; url: string }[] = [
    { name: 'Apple Maps', url: `http://maps.apple.com/?daddr=${lat},${lng}&q=${q}` },
    { name: 'Google Maps', url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` },
    { name: 'Waze', url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
  ];

  const go = (i: number) => {
    if (i >= 0 && i < targets.length) Linking.openURL(targets[i].url).catch(() => {});
  };

  if (Platform.OS === 'web') {
    // Alert/ActionSheet are unavailable on web — just open Google Maps directly.
    go(1);
  } else if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Get directions',
        options: [...targets.map((t) => t.name), 'Cancel'],
        cancelButtonIndex: targets.length,
      },
      go,
    );
  } else {
    Alert.alert('Get directions', undefined, [
      ...targets.map((t, i) => ({ text: t.name, onPress: () => go(i) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }
}
