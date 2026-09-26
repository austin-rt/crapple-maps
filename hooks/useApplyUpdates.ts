import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

// By default an OTA update downloads in the background and only takes effect on
// the next cold start, so people kept running the previous bundle for a launch
// or two. Check on launch and whenever the app comes back to the foreground,
// and reload straight into a new update when there is one.
export function useApplyUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
      } finally {
        busy = false;
      }
    };
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);
}
