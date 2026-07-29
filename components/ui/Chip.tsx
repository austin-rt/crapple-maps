import { Icon, type IconName } from './Icon';
import { Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

export function Chip({ icon, label }: { icon: IconName; label: string }) {
  const c = useColors();
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface-2 px-3 py-1">
      <Icon name={icon} size={13} color={c.content2} />
      <Text className="text-xs text-content-2">{label}</Text>
    </View>
  );
}
