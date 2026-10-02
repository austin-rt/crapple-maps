import { useIsFocused } from '@react-navigation/native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

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
  /** Center here instead of on the user, e.g. the place a post links to. */
  target?: Coords | null;
  /** Distance of the recenter button from the bottom edge. */
  recenterBottom?: number;
  /** Replace the default recenter behaviour (the finder also clears its search). */
  onRecenter?: () => void;
};

// The one map every screen uses: same styling, user dot and recenter button,
// and it opens on the user's location from the shared fix.
export const AppMap = forwardRef<AppMapHandle, Props>(function AppMap(
  { children, followUser = true, target, recenterBottom = 16, onRecenter, ...rest },
  ref,
) {
  const inner = useRef<AppMapHandle>(null);
  useImperativeHandle(ref, () => inner.current as AppMapHandle);
  const { scheme } = useThemePref();
  const loc = useMyLocation();
  const initialRegion = useRef(loc.coords ? around(loc.coords) : FALLBACK_REGION).current;

  // A map that isn't on screen ignores camera moves. The Map tab mounts at
  // launch and is hidden a tick later when the app moves to Feed, so the fix
  // usually lands while it is hidden. Centering therefore waits until the map
  // is ready AND its screen is focused, one frame after focus so the view is
  // visible, and re-runs when the fix sharpens from the IP estimate to GPS.
  const [ready, setReady] = useState(false);
  const focused = useIsFocused();

  // A target (the place a post links to, a searched address) wins over the
  // user's location, with the same ready-and-focused wait.
  const targetKey = target ? `${target.lat},${target.lng}` : null;
  const centeredTarget = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !focused || !target || !targetKey || centeredTarget.current === targetKey) return;
    const t = target;
    const frame = requestAnimationFrame(() => {
      centeredTarget.current = targetKey;
      inner.current?.animateToRegion(around(t), 500);
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targetKey stands in for target
  }, [ready, focused, targetKey]);

  const centeredOn = useRef<'none' | 'approx' | 'precise'>('none');
  useEffect(() => {
    if (!followUser || target || !ready || !focused || !loc.coords) return;
    const level = loc.precise ? 'precise' : 'approx';
    if (centeredOn.current === 'precise' || centeredOn.current === level) return;
    const coords = loc.coords;
    const frame = requestAnimationFrame(() => {
      centeredOn.current = level;
      inner.current?.animateToRegion(around(coords), 500);
    });
    return () => cancelAnimationFrame(frame);
  }, [followUser, target, ready, focused, loc.coords, loc.precise]);

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
