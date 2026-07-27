import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { ACCENT } from '@/lib/auth';

export function Placeholder({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white px-8 dark:bg-neutral-950">
      <Ionicons name={icon} size={56} color={ACCENT} />
      <Text className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{title}</Text>
      {subtitle ? (
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">{subtitle}</Text>
      ) : null}
    </View>
  );
}
