// Web map — Google Maps JS via @vis.gl/react-google-maps. Mirrors the subset of
// the react-native-maps API the app uses (initialRegion, onPress, animateToRegion
// via ref, markers with coordinate/onPress/pinColor).
import { APIProvider, Map as GMap, Marker as GMarker, useMap } from '@vis.gl/react-google-maps';
import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

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
  return (
    <View style={props.style}>
      <APIProvider apiKey={KEY}>
        <GMap
          id="main"
          defaultCenter={{ lat: r?.latitude ?? 0, lng: r?.longitude ?? 0 }}
          defaultZoom={r ? deltaToZoom(r.latitudeDelta) : 13}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          onClick={props.onPress}
          style={{ width: '100%', height: '100%' }}>
          {props.children}
        </GMap>
        <Handle ref={ref} />
      </APIProvider>
    </View>
  );
});

// Teardrop pin path, tip anchored at (0,0) pointing down — matches the native
// react-native-maps pin shape so web/iOS/Android look consistent.
const PIN_PATH = 'M 0,0 C -2,-20 -11,-22 -11,-31 A 11,11 0 1,1 11,-31 C 11,-22 2,-20 0,0 z';

export const AppMarker = ({ coordinate, onPress, pinColor }: { coordinate: { latitude: number; longitude: number }; onPress?: () => void; pinColor?: string }) => {
  const g = (globalThis as any).google as typeof google | undefined;
  const icon =
    pinColor && g
      ? {
          path: PIN_PATH,
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 1,
          anchor: new g.maps.Point(0, 0),
          labelOrigin: new g.maps.Point(0, -30),
        }
      : undefined;
  return (
    <GMarker
      position={{ lat: coordinate.latitude, lng: coordinate.longitude }}
      onClick={onPress}
      icon={icon as any}
    />
  );
};
