import { Image } from 'expo-image';
import { Dimensions, View } from 'react-native';

// Content column width = screen − horizontal padding (16·2) − avatar (44) − gap (12).
const CONTENT_W = Dimensions.get('window').width - 88;

export function FeedPhotos({ photos }: { photos: string[] }) {
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
