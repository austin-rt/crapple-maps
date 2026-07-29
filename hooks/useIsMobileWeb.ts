import { Platform, useWindowDimensions } from 'react-native';

// True on a web browser at a phone-sized viewport. Used to serve the native-style
// mobile experience (bottom tab bar + bottom sheet) on the web instead of the
// desktop layout (top header + left drawer). Native apps are never "mobile web".
export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width < 768;
}
