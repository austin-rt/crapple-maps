import { Image } from 'expo-image';
import { useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions, View } from 'react-native';

// A single photo goes full-width; two or more tile into a 2-up grid. Column is
// capped so it stays readable on wide web screens.
export function PostPhotos({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions();
  // Sized in pixels from the measured row: a percentage width renders blank on
  // iOS and Android, and the window width misses the web column's border.
  const [measured, setMeasured] = useState<number | null>(null);
  const W = measured ?? Math.min(width, 600) - 32; // minus the px-4 gutters
  const onLayout = (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width - 32);
  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <View className="mt-3 px-4" onLayout={onLayout}>
        <Image source={{ uri: photos[0] }} style={{ width: W, height: Math.round(W * 0.72), borderRadius: 16 }} contentFit="cover" />
      </View>
    );
  }

  const size = Math.floor((W - 8) / 2);
  return (
    <View className="mt-3 px-4" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} onLayout={onLayout}>
      {photos.slice(0, 4).map((uri, i) => (
        <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: size, height: size, borderRadius: 14 }} contentFit="cover" />
      ))}
    </View>
  );
}
