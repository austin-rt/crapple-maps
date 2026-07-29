import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

// Small icon + label pill (amenity/facts).
export function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const c = useColors();
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
      <Ionicons name={icon} size={13} color={c.content2} />
      <Text className="text-xs text-neutral-600 dark:text-neutral-300">{label}</Text>
    </View>
  );
}
