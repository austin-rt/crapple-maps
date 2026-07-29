import { Icon, type IconName } from '@/components/ui';
import { Pressable, Text, View } from 'react-native';

import { useColors, useThemePref, type ThemePref } from '@/lib/theme';
import { ACCENT, ON_ACCENT } from '@/lib/tokens';

import { Card } from './Card';

const THEME_OPTS: { key: ThemePref; label: string; icon: IconName }[] = [
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
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-line'}`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Icon name={icon} size={16} color={on ? ON_ACCENT : c.content2} />
              <Text className={on ? 'font-semibold text-white' : 'text-content-2'}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
