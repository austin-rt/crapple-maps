import { Image, View } from 'react-native';

import { useThemePref } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

// The ONE marker, off-map. It renders the exact same pin PNG the map uses
// (components/map.tsx) — Google-style teardrop, theme-aware outline, transparent
// center cutout — inside a circle whose background is the accent at low opacity,
// so it tints whatever surface is behind it and reads in both light and dark.
const PIN = {
  light: require('@/assets/markers/pin-teal.png'),
  dark: require('@/assets/markers/pin-teal-dark.png'),
};

export function MarkerBadge({ size = 40 }: { size?: number }) {
  const { scheme } = useThemePref();
  const h = size * 0.56; // pin height inside the circle (27:43 aspect)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT + '24', // ~14% accent — adapts over light or dark
        borderWidth: 1,
        borderColor: ACCENT + '33', // ~20% accent
      }}>
      <Image
        source={scheme === 'dark' ? PIN.dark : PIN.light}
        style={{ width: (h * 27) / 43, height: h }}
        resizeMode="contain"
      />
    </View>
  );
}
