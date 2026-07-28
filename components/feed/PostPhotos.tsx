import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';

// Post-detail photo layout: a single photo goes full-width; two or more tile
// into a 2-up grid. Column is capped so it stays readable on wide web screens.
export function PostPhotos({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 600) - 32; // minus the px-4 gutters
  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <View className="mt-3 px-4">
        <Image source={{ uri: photos[0] }} style={{ width: W, height: Math.round(W * 0.72), borderRadius: 16 }} contentFit="cover" />
      </View>
    );
  }

  // Percentage widths + space-between wrap cleanly into 2-up without the
  // exact-pixel rounding that can force a single column.
  return (
    <View className="mt-3 px-4" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', maxWidth: W + 32 }}>
      {photos.slice(0, 4).map((uri, i) => (
        <Image
          key={`${uri}-${i}`}
          source={{ uri }}
          style={{ width: '48.5%', aspectRatio: 1, borderRadius: 14, marginBottom: 8 }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}
