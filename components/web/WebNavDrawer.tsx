import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemePref } from '@/lib/theme';
import { ACCENT } from '@/lib/tokens';

const WIDTH = 300;

const ITEMS = [
  { href: '/', label: 'Map', icon: 'map-outline' },
  { href: '/feed', label: 'Feed', icon: 'newspaper-outline' },
  { href: '/compose', label: 'Log', icon: 'add-circle-outline' },
  { href: '/my-map', label: 'My Map', icon: 'trail-sign-outline' },
  { href: '/people', label: 'People', icon: 'people-outline' },
  { href: '/profile', label: 'Profile', icon: 'person-outline' },
] as const;

// Web-only slide-from-left app nav. Stays mounted so it can animate open/closed;
// pointer-events are off while closed so it never blocks the page underneath.
export function WebNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const { scheme } = useThemePref();
  const x = useRef(new Animated.Value(open ? 0 : -WIDTH)).current;
  const fade = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(x, { toValue: open ? 0 : -WIDTH, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [open, x, fade]);

  const go = (href: string) => {
    router.push(href as any);
    onClose();
  };
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50 }}>
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          { position: 'absolute', top: 0, bottom: 0, left: 0, width: WIDTH, paddingTop: 14, transform: [{ translateX: x }], backgroundColor: scheme === 'dark' ? '#0a0a0c' : '#ffffff' },
          styles.shadow,
        ]}>
        <View className="flex-row items-center justify-between border-b border-line px-5 pb-4">
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="location" size={24} color={ACCENT} />
            <Text className="text-xl font-extrabold text-content">
              Crapple <Text style={{ color: ACCENT }}>Maps</Text>
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} className="items-center justify-center">
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>
        <View className="px-3 pt-3">
          {ITEMS.map((it) => {
            const on = active(it.href);
            return (
              <Pressable
                key={it.href}
                onPress={() => go(it.href)}
                className="mb-1 flex-row items-center gap-3 rounded-xl px-4 py-3"
                style={on ? { backgroundColor: ACCENT + '18' } : undefined}>
                <Ionicons name={it.icon as any} size={22} color={on ? ACCENT : '#6B7280'} />
                <Text className="text-base font-semibold" style={on ? { color: ACCENT } : undefined}>
                  <Text className={on ? '' : 'text-content'}>{it.label}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 2, height: 0 } },
});
