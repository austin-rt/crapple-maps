import { Icon, type IconName } from './Icon';
import { Pressable, View } from 'react-native';

import { useColors } from '@/lib/theme';

export function InfoRow({
  icon,
  children,
  onPress,
}: {
  icon: IconName;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const c = useColors();
  const body = (
    <View className="flex-row items-start gap-3 py-2.5">
      <Icon name={icon} size={18} color={c.content2} style={{ marginTop: 1 }} />
      <View className="flex-1">{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} className="active:opacity-70">
      {body}
    </Pressable>
  ) : (
    body
  );
}
