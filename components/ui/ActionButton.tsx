import { Icon, type IconName } from './Icon';
import { Pressable, Text, View } from 'react-native';

import { ACCENT, ON_ACCENT } from '@/lib/tokens';

export function ActionButton({
  icon,
  label,
  onPress,
  filled,
  tint = ACCENT,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  filled?: boolean;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="items-center gap-1">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${filled ? '' : 'border border-line'}`}
        style={filled ? { backgroundColor: tint } : undefined}>
        <Icon name={icon} size={20} color={filled ? ON_ACCENT : tint} />
      </View>
      <Text className="text-xs text-content-2" style={tint === ACCENT ? undefined : { color: tint }}>
        {label}
      </Text>
    </Pressable>
  );
}
