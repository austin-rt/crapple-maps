import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const noopSubscribe = () => () => {};

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
  // The static web export renders every page with no window (width 0), so its
  // HTML always holds the mobile layout. Report that while hydrating so the
  // first client render matches the HTML, then the real answer right after.
  // Answering for real during hydration made React discard the page with a
  // hydration error (#418) on every desktop load.
  const hydrating = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (Platform.OS !== 'web') return false;
  if (hydrating) return true;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (PHONE_UA.test(ua)) return true;
  if (TABLET_UA.test(ua)) return false;
  return width < 768;
}
