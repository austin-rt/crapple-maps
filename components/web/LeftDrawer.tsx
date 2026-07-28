import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View, type ViewStyle } from 'react-native';

import { useThemePref } from '@/lib/theme';

// One web drawer used everywhere — the app nav and the results list both slide in
// from the left with the same animation and an OPAQUE, theme-aware background.
// NB: the background MUST be an explicit backgroundColor. NativeWind's
// `className="bg-surface"` does not apply on an Animated.View in react-native-web
// (that's what made the results drawer render transparent over the map).
export function LeftDrawer({
  open,
  width,
  scrim = false,
  onScrimPress,
  zIndex = 20,
  panelStyle,
  children,
}: {
  open: boolean;
  width: number;
  scrim?: boolean; // dim + cover the page behind (nav); off keeps the map interactive
  onScrimPress?: () => void;
  zIndex?: number;
  panelStyle?: ViewStyle;
  children: React.ReactNode;
}) {
  const { scheme } = useThemePref();
  const bg = scheme === 'dark' ? '#0a0a0c' : '#ffffff';
  const off = -(width + 24); // fully clear of the edge so the shadow doesn't peek
  const x = useRef(new Animated.Value(open ? 0 : off)).current;
  const fade = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(x, { toValue: open ? 0 : off, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [open, off, x, fade]);

  return (
    <>
      {scrim ? (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex, backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={onScrimPress} />
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width,
            backgroundColor: bg,
            zIndex: zIndex + 1,
            transform: [{ translateX: x }],
            ...(Platform.OS === 'web' ? { boxShadow: '2px 0 16px rgba(0,0,0,0.18)' } : null),
          } as ViewStyle,
          panelStyle,
        ]}>
        {children}
      </Animated.View>
    </>
  );
}
