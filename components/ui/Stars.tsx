import { Icon } from './Icon';
import { useRef } from 'react';
import { PanResponder, View } from 'react-native';

import { STAR } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// PanResponder is only created when `onChange` is given, so a read-only display
// never captures pointer/scroll gestures on web.
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

  const c = useColors();
  return (
    <View
      {...(pan ? pan.panHandlers : {})}
      onLayout={onChange ? (e) => (widthRef.current = e.nativeEvent.layout.width) : undefined}
      style={{ flexDirection: 'row', gap, alignSelf: 'flex-start', paddingVertical: onChange ? 4 : 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? STAR : c.content2} />
      ))}
    </View>
  );
}
