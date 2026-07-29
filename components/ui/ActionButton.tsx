import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { ACCENT, ON_ACCENT } from '@/lib/tokens';

// Google-Maps-style round action button with a label. `tint` recolors it
// (e.g. red for a destructive Cancel); `filled` gives it a solid background.
export function ActionButton({
  icon,
  label,
  onPress,
  filled,
  tint = ACCENT,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  filled?: boolean;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="items-center gap-1">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${filled ? '' : 'border border-neutral-300 dark:border-neutral-700'}`}
        style={filled ? { backgroundColor: tint } : undefined}>
        <Ionicons name={icon} size={20} color={filled ? ON_ACCENT : tint} />
      </View>
      <Text className="text-xs text-neutral-600 dark:text-neutral-300" style={tint === ACCENT ? undefined : { color: tint }}>
        {label}
      </Text>
    </Pressable>
  );
}
