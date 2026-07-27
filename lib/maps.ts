import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

// Map tile provider. 'google' === PROVIDER_GOOGLE, undefined === PROVIDER_DEFAULT.
// Kept as a plain string so this module never imports react-native-maps (which is
// native-only and breaks the web bundle). The native map wrapper applies it.
export const USE_GOOGLE_MAPS = true;
export const MAP_PROVIDER: 'google' | undefined = USE_GOOGLE_MAPS ? 'google' : undefined;

// Google "night" map style, applied when the app is in dark mode so the map
// tiles match the theme. Pass to <MapView customMapStyle={...}> (Google only).
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1f2023' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2023' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#5a5f66' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c8ccd1' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1b2a1f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#7a8a7f' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2f34' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373b40' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#414750' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12283a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6a86' }] },
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

  if (Platform.OS === 'ios') {
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
