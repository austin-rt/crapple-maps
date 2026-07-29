import { Platform, useWindowDimensions } from 'react-native';

// True on a phone-class web browser — it gets the native-style mobile experience
// (bottom sheet + tabs). Tablets and desktop get the desktop layout. Native apps
// are never "mobile web".
//
// Detection order: phone UA wins regardless of width (so landscape phones stay
// mobile); explicit tablet UA is always desktop; otherwise fall back to viewport
// width (narrow desktop windows and iPads — which report a desktop UA — resolve
// by size). We read width so it re-evaluates on resize/rotate.
const PHONE_UA = /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini|IEMobile/i;
const TABLET_UA = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i;

export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return false;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (PHONE_UA.test(ua)) return true;
  if (TABLET_UA.test(ua)) return false;
  return width < 768;
}
