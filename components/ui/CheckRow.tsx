import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/lib/theme';
import { ACCENT, ON_ACCENT } from '@/lib/tokens';

import { Icon } from './Icon';

export function CheckRow({ checked, onToggle, title, hint }: { checked: boolean; onToggle: () => void; title: string; hint?: string }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 active:opacity-70">
      <View
        className="h-6 w-6 items-center justify-center rounded-md border"
        style={{ borderColor: checked ? ACCENT : c.content2, backgroundColor: checked ? ACCENT : 'transparent' }}>
        {checked ? <Icon name="checkmark" size={16} color={ON_ACCENT} /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-content">{title}</Text>
        {hint ? <Text className="text-xs text-content-2">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
