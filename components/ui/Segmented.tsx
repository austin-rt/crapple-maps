import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';

// Equal-width segmented selector. `options` are [label, value] pairs.
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
            className={`flex-1 items-center rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
            style={on ? { backgroundColor: ACCENT } : undefined}>
            <Text className={on ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
