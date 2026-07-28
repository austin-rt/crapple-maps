import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { PanResponder, View } from 'react-native';

import { ACCENT, MUTED } from '@/lib/tokens';

// Unified star rating. Interactive when `onChange` is given (tap/drag across the
// row); otherwise a static read-only display — PanResponder is only created in
// the interactive case so it never captures pointer/scroll gestures on web.
export function Stars({
  value,
  onChange,
  size = 36,
  gap = 8,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  gap?: number;
}) {
  const widthRef = useRef((size + gap) * 5);

  const pan = useRef(
    onChange
      ? PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
          onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
        })
      : null,
  ).current;

  function setFromX(x: number) {
    const per = widthRef.current / 5;
    onChange?.(Math.max(0, Math.min(5, Math.ceil(x / per))));
  }

  return (
    <View
      {...(pan ? pan.panHandlers : {})}
      onLayout={onChange ? (e) => (widthRef.current = e.nativeEvent.layout.width) : undefined}
      style={{ flexDirection: 'row', gap, alignSelf: 'flex-start', paddingVertical: onChange ? 4 : 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? ACCENT : MUTED} />
      ))}
    </View>
  );
}
