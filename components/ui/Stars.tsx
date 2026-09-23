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

  // PanResponder.create runs once, so its handlers close over the FIRST
  // render's onChange. Callers pass an inline arrow, so route through a ref to
  // avoid calling a stale one.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const per = widthRef.current / 5;
    onChangeRef.current?.(Math.max(0, Math.min(5, Math.ceil(x / per))));
  };

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

  const c = useColors();
  return (
    <View
      {...(pan ? pan.panHandlers : {})}
      onLayout={onChange ? (e) => (widthRef.current = e.nativeEvent.layout.width) : undefined}
      style={{ alignSelf: 'flex-start', paddingVertical: onChange ? 4 : 0 }}>
      {/* pointerEvents="none" is load-bearing, not decoration. `locationX` is
          measured against the touch TARGET, and on the initial press that
          target is whichever star was hit — so tapping the 5th star reported an
          x of a few points and set the rating to 1. It only behaved while
          dragging, because by then the container had become the responder.
          Making the stars transparent to touches means the container is always
          the target, so press and drag agree. */}
      <View pointerEvents="none" style={{ flexDirection: 'row', gap }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? STAR : c.content2}
          />
        ))}
      </View>
    </View>
  );
}
