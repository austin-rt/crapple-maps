import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

export function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const c = useColors();
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface-2 px-3 py-1">
      <Ionicons name={icon} size={13} color={c.content2} />
      <Text className="text-xs text-content-2">{label}</Text>
    </View>
  );
}
