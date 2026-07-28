import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';

const ITEMS = [
  { href: '/', label: 'Map', icon: 'map-outline' },
  { href: '/feed', label: 'Feed', icon: 'newspaper-outline' },
  { href: '/compose', label: 'Log', icon: 'add-circle-outline' },
  { href: '/my-map', label: 'My Map', icon: 'trail-sign-outline' },
  { href: '/people', label: 'People', icon: 'people-outline' },
  { href: '/profile', label: 'Profile', icon: 'person-outline' },
] as const;

// Web-only slide-from-left app nav, opened by the hamburger. Replaces the bottom
// tab bar on web (hidden in (tabs)/_layout on web).
export function WebNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  if (!open) return null;
  const go = (href: string) => {
    router.push(href as any);
    onClose();
  };
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <View className="bg-surface" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 300, paddingTop: 14 }}>
        <View className="flex-row items-center gap-2.5 border-b border-line px-5 pb-4">
          <Ionicons name="location" size={26} color={ACCENT} />
          <Text className="text-xl font-extrabold text-content">
            Crapple <Text style={{ color: ACCENT }}>Maps</Text>
          </Text>
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
                <Text className="text-base font-semibold" style={{ color: on ? ACCENT : undefined }}>
                  <Text className="text-content">{it.label}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
