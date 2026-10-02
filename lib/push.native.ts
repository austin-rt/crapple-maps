import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

type NotificationsModule = typeof import('expo-notifications');

// Required lazily: a binary built before expo-notifications was added has no
// native module, and a top-level import would crash every screen that imports
// auth. Without it, push quietly does nothing.
const N: NotificationsModule | null = (() => {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
})();

N?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

let deviceToken: string | null = null;

async function expoPushToken(n: NotificationsModule): Promise<string | null> {
  const { status } = await n.getPermissionsAsync();
  let granted = status === 'granted';
  if (!granted && status !== 'denied') granted = (await n.requestPermissionsAsync()).status === 'granted';
  if (!granted) return null;
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync('default', { name: 'Activity', importance: n.AndroidImportance.DEFAULT });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  return (await n.getExpoPushTokenAsync({ projectId })).data;
}

// Asks for permission the first time, then saves this device's token for the
// signed-in account. Failures (simulator, no network, Android without FCM)
// leave the app working without push.
export async function registerPush(userId: string) {
  if (!N) return;
  try {
    const token = await expoPushToken(N);
    if (!token) return;
    deviceToken = token;
    await supabase.from('push_tokens').upsert({
      user_id: userId,
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      updated_at: new Date().toISOString(),
    });
  } catch {}
}

// Called before sign-out so this device stops getting the account's alerts.
export async function unregisterPush(userId: string) {
  if (!deviceToken) return;
  try {
    await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', deviceToken);
  } catch {}
}

export async function clearBadge() {
  try {
    await N?.setBadgeCountAsync(0);
  } catch {}
}

// Tapping an alert opens what it's about, including the alert that launched
// the app. Waits until the navigator can take a push.
export function usePushNavigation(navReady: boolean) {
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!N || !navReady) return;
    const open = (r: import('expo-notifications').NotificationResponse | null) => {
      if (!r || handled.current === r.notification.request.identifier) return;
      handled.current = r.notification.request.identifier;
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    N.getLastNotificationResponseAsync().then(open);
    const sub = N.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [navReady]);
}
