import { Icon, type IconName } from './Icon';
import { Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

export function Chip({
  icon,
  emoji,
  label,
  size = 'md',
}: {
  icon?: IconName;
  emoji?: string;
  label: string;
  size?: 'sm' | 'md';
}) {
  const c = useColors();
  const sm = size === 'sm';
  return (
    <View className={`flex-row items-center gap-1 rounded-full bg-surface-3 ${sm ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
      {icon ? <Icon name={icon} size={sm ? 11 : 13} color={c.content2} /> : null}
      {emoji ? <Text className={sm ? 'text-xs' : 'text-base'}>{emoji}</Text> : null}
      <Text className={`font-medium text-content-2 ${sm ? 'text-[11px]' : 'text-xs'}`}>{label}</Text>
    </View>
  );
}
