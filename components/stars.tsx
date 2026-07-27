import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { PanResponder, View } from 'react-native';

import { ACCENT } from '@/lib/auth';

// Tap or drag across the row to set the rating; stars fill/unfill as you drag.
export function Stars({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const widthRef = useRef((size + 8) * 5);

  const setFromX = (x: number) => {
    const per = widthRef.current / 5;
    const n = Math.max(0, Math.min(5, Math.ceil(x / per)));
    onChange(n);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => (widthRef.current = e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= value ? 'star' : 'star-outline'}
          size={size}
          color={n <= value ? ACCENT : '#9CA3AF'}
        />
      ))}
    </View>
  );
}
