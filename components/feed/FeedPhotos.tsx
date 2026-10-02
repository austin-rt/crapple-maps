import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';

import { GraphicShield } from './GraphicShield';

export function FeedPhotos({ photos, logId, graphic }: { photos: string[]; logId: string; graphic: boolean }) {
  const { width } = useWindowDimensions();
  // Content column width = column (capped at the 600px web timeline) − padding
  // (16·2) − avatar (44) − gap (12). Capping keeps web photos from ballooning to
  // the full browser width.
  const CONTENT_W = Math.min(width, 600) - 88;
  if (photos.length === 0) return null;
  if (photos.length === 1) {
    return (
      <GraphicShield logId={logId} graphic={graphic} radius={14} style={{ width: CONTENT_W }}>
        {(blur) => <Image source={{ uri: photos[0] }} blurRadius={blur} style={{ width: CONTENT_W, height: 200 }} contentFit="cover" />}
      </GraphicShield>
    );
  }
  const size = (CONTENT_W - 4) / 2; // 2-up grid, 4px gutter
  return (
    <GraphicShield logId={logId} graphic={graphic} radius={14} style={{ width: CONTENT_W }}>
      {(blur) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {photos.slice(0, 4).map((uri, i) => (
            <Image key={`${uri}-${i}`} source={{ uri }} blurRadius={blur} style={{ width: size, height: size }} contentFit="cover" />
          ))}
        </View>
      )}
    </GraphicShield>
  );
}
