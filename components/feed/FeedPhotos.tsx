import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';

export function FeedPhotos({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions();
  // Content column width = column (capped at the 600px web timeline) − padding
  // (16·2) − avatar (44) − gap (12). Capping keeps web photos from ballooning to
  // the full browser width.
  const CONTENT_W = Math.min(width, 600) - 88;
  if (photos.length === 0) return null;
  if (photos.length === 1) {
    return <Image source={{ uri: photos[0] }} style={{ width: CONTENT_W, height: 200, borderRadius: 14 }} contentFit="cover" />;
  }
  const size = (CONTENT_W - 4) / 2; // 2-up grid, 4px gutter
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: CONTENT_W, borderRadius: 14, overflow: 'hidden' }}>
      {photos.slice(0, 4).map((uri, i) => (
        <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ))}
    </View>
  );
}
