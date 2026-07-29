import { Icon } from '@/components/ui';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

import { LeftDrawer } from './LeftDrawer';

const WIDTH = 300;

const ITEMS = [
  { href: '/', label: 'Map', icon: 'map-outline' },
  { href: '/feed', label: 'Feed', icon: 'newspaper-outline' },
  { href: '/compose', label: 'Log', icon: 'add-circle-outline' },
  { href: '/my-map', label: 'My Map', icon: 'trail-sign-outline' },
  { href: '/people', label: 'People', icon: 'people-outline' },
  { href: '/profile', label: 'Profile', icon: 'person-outline' },
] as const;

// Presentation lives in the shared LeftDrawer so it can't drift from the results drawer.
export function WebNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const c = useColors();
  const go = (href: string) => {
    router.push(href as any);
    onClose();
  };
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <LeftDrawer open={open} width={WIDTH} scrim onScrimPress={onClose} zIndex={50} panelStyle={{ paddingTop: 14 }}>
      <View className="flex-row items-center justify-between border-b border-line px-5 pb-4">
        <View className="flex-row items-center gap-2.5">
          <Icon name="location" size={24} color={ACCENT} />
          <Text className="text-xl font-extrabold text-content">
            Crapple <Text style={{ color: ACCENT }}>Maps</Text>
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} className="items-center justify-center">
          <Icon name="close" size={24} color={c.content2} />
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
              <Icon name={it.icon as any} size={22} color={on ? ACCENT : c.content2} />
              <Text className="text-base font-semibold" style={on ? { color: ACCENT } : undefined}>
                <Text className={on ? '' : 'text-content'}>{it.label}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
    </LeftDrawer>
  );
}
