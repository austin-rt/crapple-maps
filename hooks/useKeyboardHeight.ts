import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Edge-to-edge Android does not resize the window for the keyboard, so content
// under it stays hidden. Screens pad by this height to lift fields clear.
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
