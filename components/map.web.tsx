// Web map — Google Maps JS via @vis.gl/react-google-maps. Mirrors the subset of
// the react-native-maps API the app uses (initialRegion, onPress, animateToRegion
// via ref, markers with coordinate/onPress/pinColor).
import { APIProvider, Map as GMap, Marker as GMarker, useApiIsLoaded, useMap } from '@vis.gl/react-google-maps';
import { forwardRef, useImperativeHandle } from 'react';
import { Image, View } from 'react-native';

import { DARK_MAP_STYLE } from '@/lib/maps';
import { useThemePref } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
export type AppMapHandle = { animateToRegion: (r: Region, duration?: number) => void };

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY ?? '';

function deltaToZoom(latDelta: number) {
  return Math.max(3, Math.min(20, Math.round(Math.log2(360 / Math.max(0.0005, latDelta)))));
}

// Lives inside <APIProvider> so useMap() can reach the map instance for panning.
const Handle = forwardRef<AppMapHandle, {}>((_props, ref) => {
  const map = useMap('main');
  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (r: Region) => {
        if (!map) return;
        map.panTo({ lat: r.latitude, lng: r.longitude });
        if (r.latitudeDelta) map.setZoom(deltaToZoom(r.latitudeDelta));
      },
    }),
    [map],
  );
  return null;
});
Handle.displayName = 'MapHandle';

export const AppMapView = forwardRef<AppMapHandle, any>(function AppMapView(props, ref) {
  const r: Region | undefined = props.initialRegion;
  const { scheme } = useThemePref();
  return (
    <View style={props.style}>
      <APIProvider apiKey={KEY}>
        <GMap
          id="main"
          defaultCenter={{ lat: r?.latitude ?? 0, lng: r?.longitude ?? 0 }}
          defaultZoom={r ? deltaToZoom(r.latitudeDelta) : 13}
          styles={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          onClick={props.onPress}
          onIdle={(e: any) => {
            // Fires after a pan/zoom settles → report the new center so the
            // finder refetches restrooms for the visible area.
            const c = e?.map?.getCenter?.();
            if (c && props.onRegionChangeComplete) {
              props.onRegionChangeComplete({ latitude: c.lat(), longitude: c.lng() });
            }
          }}
          onContextmenu={(e: any) => {
            // Long-press (touch) / right-click (desktop) → add-a-restroom. Normalize
            // {lat,lng} to the native onLongPress event shape so the finder reads
            // e.nativeEvent.coordinate the same way on every platform.
            const ll = e?.detail?.latLng;
            if (ll && props.onLongPress) {
              props.onLongPress({ nativeEvent: { coordinate: { latitude: ll.lat, longitude: ll.lng } } });
            }
          }}
          style={{ width: '100%', height: '100%' }}>
          {props.children}
        </GMap>
        <Handle ref={ref} />
      </APIProvider>
    </View>
  );
});

// Web pins reuse the same high-res PNG art as native (components/map.tsx): a
// Google-style teardrop with a transparent center cutout and a theme-aware
// outline (white on the light map, #1f2023 on the dark map). Displayed at 27x43
// from the 81x129 source so the browser downscales -> crisp on retina.
const PIN_LIGHT: Record<string, number> = {
  [ACCENT]: require('@/assets/markers/pin-teal-web.png'), // default
  '#DC2626': require('@/assets/markers/pin-red-web.png'), // selected
  '#7C3AED': require('@/assets/markers/pin-purple-web.png'), // visited
};
const PIN_DARK: Record<string, number> = {
  [ACCENT]: require('@/assets/markers/pin-teal-web-dark.png'),
  '#DC2626': require('@/assets/markers/pin-red-web-dark.png'),
  '#7C3AED': require('@/assets/markers/pin-purple-web-dark.png'),
};

// Resolve lazily + guarded: Image.resolveAssetSource doesn't exist in the web
// static-render (SSR) pass, and google.maps isn't loaded there either.
function pinUri(pinColor: string | undefined, dark: boolean): string | undefined {
  const mod: any = pinColor ? (dark ? PIN_DARK : PIN_LIGHT)[pinColor] : undefined;
  if (mod == null) return undefined;
  // On web, require('*.png') already resolves to { uri, width, height };
  // resolveAssetSource doesn't exist in react-native-web.
  if (typeof mod === 'string') return mod;
  return mod.uri ?? (Image as any).resolveAssetSource?.(mod)?.uri;
}

export const AppMarker = ({ coordinate, onPress, pinColor }: { coordinate: { latitude: number; longitude: number }; onPress?: () => void; pinColor?: string }) => {
  const loaded = useApiIsLoaded();
  const g = (globalThis as any).google as typeof google | undefined;
  const { scheme } = useThemePref();
  // Only mount the marker once the Maps API is ready, so it's created WITH our
  // icon from the start — @vis.gl's Marker doesn't reliably swap the icon after
  // creation, which otherwise left every pin on Google's default red icon.
  if (!loaded || !g?.maps?.Size) return null;
  const uri = pinUri(pinColor, scheme === 'dark');
  const icon = uri
    ? { url: uri, scaledSize: new g.maps.Size(27, 43), anchor: new g.maps.Point(13.5, 43) }
    : undefined;
  // Key by the resolved icon so select (red) / theme changes remount cleanly.
  return <GMarker key={uri ?? 'default'} position={{ lat: coordinate.latitude, lng: coordinate.longitude }} onClick={onPress} icon={icon as any} />;
};
