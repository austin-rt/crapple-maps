import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { useColors, useThemePref, type ThemePref } from '@/lib/theme';
import { ACCENT, ON_ACCENT } from '@/lib/tokens';

import { Card } from './Card';

const THEME_OPTS: { key: ThemePref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export function AppearanceCard() {
  const { pref, setPref } = useThemePref();
  const c = useColors();
  return (
    <Card title="Appearance">
      <View className="flex-row gap-2">
        {THEME_OPTS.map(({ key, label, icon }) => {
          const on = pref === key;
          return (
            <Pressable
              key={key}
              onPress={() => setPref(key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Ionicons name={icon} size={16} color={on ? ON_ACCENT : c.content2} />
              <Text className={on ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
