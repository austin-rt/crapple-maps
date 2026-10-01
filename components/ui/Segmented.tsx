import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/lib/theme';
import { ACCENT, ON_ACCENT } from '@/lib/tokens';

import { Icon, type IconName } from './Icon';

export function Segmented<T>({
  options,
  value,
  onChange,
}: {
  options: [string, T, IconName?][];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View className="flex-row gap-2">
      {options.map(([label, val, icon]) => {
        const on = value === val;
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(val)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-line'}`}
            style={on ? { backgroundColor: ACCENT } : undefined}>
            {icon ? <Icon name={icon} size={16} color={on ? ON_ACCENT : c.content2} /> : null}
            <Text className={on ? 'font-semibold text-white' : 'text-content-2'}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
