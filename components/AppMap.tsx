import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { AppMapView, type AppMapHandle, type Region } from '@/components/map';
import { Icon } from '@/components/ui';
import { locatePrecisely, useMyLocation, type Coords } from '@/hooks/useMyLocation';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { ACCENT } from '@/lib/tokens';
import { useThemePref } from '@/lib/theme';

export const FALLBACK_REGION: Region = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const around = (c: Coords): Region => ({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 });

type Props = React.ComponentProps<typeof AppMapView> & {
  children?: React.ReactNode;
  /** Glide to the user when their location arrives (and when it sharpens from the IP estimate to GPS). */
  followUser?: boolean;
  /** Distance of the recenter button from the bottom edge. */
  recenterBottom?: number;
  /** Replace the default recenter behaviour (the finder also clears its search). */
  onRecenter?: () => void;
};

// The one map every screen uses: same styling, user dot and recenter button,
// and it opens on the user's location from the shared fix.
export const AppMap = forwardRef<AppMapHandle, Props>(function AppMap(
  { children, followUser = true, recenterBottom = 16, onRecenter, ...rest },
  ref,
) {
  const inner = useRef<AppMapHandle>(null);
  useImperativeHandle(ref, () => inner.current as AppMapHandle);
  const { scheme } = useThemePref();
  const loc = useMyLocation();
  const initialRegion = useRef(loc.coords ? around(loc.coords) : FALLBACK_REGION).current;

  // A map that isn't laid out yet (e.g. a tab that hasn't been shown) ignores
  // camera moves, so centering waits for onMapReady and re-runs when the fix
  // sharpens from the IP estimate to GPS.
  const [ready, setReady] = useState(Platform.OS === 'web');
  const centeredOn = useRef<'none' | 'approx' | 'precise'>('none');
  useEffect(() => {
    if (!followUser || !ready || !loc.coords) return;
    const level = loc.precise ? 'precise' : 'approx';
    if (centeredOn.current === 'precise' || centeredOn.current === level) return;
    centeredOn.current = level;
    inner.current?.animateToRegion(around(loc.coords), 500);
  }, [followUser, ready, loc.coords, loc.precise]);

  const recenter = async () => {
    if (onRecenter) return onRecenter();
    const c = loc.precise && loc.coords ? loc.coords : await locatePrecisely();
    if (c) inner.current?.animateToRegion(around(c), 500);
  };

  return (
    <>
      <AppMapView
        ref={inner}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        initialRegion={initialRegion}
        {...rest}
        onMapReady={(...args: unknown[]) => {
          setReady(true);
          (rest as { onMapReady?: (...a: unknown[]) => void }).onMapReady?.(...args);
        }}>
        {children}
      </AppMapView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Center map on my location"
        onPress={recenter}
        hitSlop={8}
        className="absolute items-center justify-center rounded-full bg-surface"
        style={[{ right: 16, bottom: recenterBottom, width: 46, height: 46 }, styles.shadow]}>
        <Icon name="locate" size={22} color={ACCENT} />
      </Pressable>
    </>
  );
});

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
