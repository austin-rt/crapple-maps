import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useColors } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

// "Get the app" bar for phone and tablet browsers. iPhone and iPad Safari are
// left out on purpose: they show Apple's own Smart App Banner (the
// apple-itunes-app meta in app/+html.tsx), which already knows whether the app
// is installed. Chrome on iOS and in-app browsers (Instagram, Facebook, Gmail's
// web view) never show Apple's banner, and Android has no equivalent, so those
// get this one.
const APP_STORE = 'https://apps.apple.com/app/id6795301489';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.austinrt.crapplemaps';
const DISMISS_KEY = 'cm.getAppBanner.dismissedAt';
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
const NOT_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|LinkedInApp|musical_ly|Bytedance|Pinterest/i;

type Store = 'ios' | 'android';

function storeFor(ua: string, touchPoints: number): Store | null {
  if (/Android/i.test(ua)) return 'android';
  // iPadOS Safari reports a Mac user agent; touch support gives it away.
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1);
  if (!ios) return null;
  // Web views inside other apps drop the "Safari/" token.
  return NOT_SAFARI.test(ua) || !/Safari\//.test(ua) ? 'ios' : null;
}

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function GetAppBanner() {
  const c = useColors();
  // Decided after mount, never during render, so the static HTML (rendered with
  // no browser) and the first client render agree and hydration stays clean.
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || dismissedRecently()) return;
    const s = storeFor(navigator.userAgent, navigator.maxTouchPoints || 0);
    if (s === 'ios') {
      setStore('ios');
    } else if (s === 'android') {
      // The Play listing 404s until Google approves the first release, so only
      // offer it once api/store-status sees it live.
      fetch('/api/store-status')
        .then((r) => r.json())
        .then((j) => {
          if (j?.android) setStore('android');
        })
        .catch(() => {});
    }
  }, []);

  if (!store) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setStore(null);
  };
  const get = () => {
    window.location.href = store === 'ios' ? APP_STORE : PLAY_STORE;
  };

  return (
    <View className="flex-row items-center border-b border-line bg-surface px-3 py-2" style={{ gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={dismiss} hitSlop={10}>
        <Icon name="close" size={18} color={c.content2} />
      </Pressable>
      <Image source={require('@/assets/images/icon.png')} style={{ width: 40, height: 40, borderRadius: 9 }} />
      <View className="flex-1">
        <Text className="text-sm font-bold text-content" numberOfLines={1}>
          Crapple Maps
        </Text>
        <Text className="text-xs text-content2" numberOfLines={1}>
          {store === 'ios' ? 'Free on the App Store' : 'Free on Google Play'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={store === 'ios' ? 'Get Crapple Maps on the App Store' : 'Get Crapple Maps on Google Play'}
        onPress={get}
        className="rounded-full px-5 py-1.5"
        style={{ backgroundColor: ACCENT }}>
        <Text className="text-sm font-bold" style={{ color: '#fff' }}>
          Get
        </Text>
      </Pressable>
    </View>
  );
}
