import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';

export function Segmented<T>({
  options,
  value,
  onChange,
}: {
  options: [string, T][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map(([label, val]) => {
        const on = value === val;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(val)}
            className={`flex-1 items-center rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-line'}`}
            style={on ? { backgroundColor: ACCENT } : undefined}>
            <Text className={on ? 'font-semibold text-white' : 'text-content-2'}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
