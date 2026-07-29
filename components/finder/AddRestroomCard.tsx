import { Icon } from '@/components/ui';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';

// Rendered atop the results list on both the native bottom-sheet and the web
// left-drawer so the two layouts never drift. Styled as a full-width list row
// to match PlaceCard.
export function AddRestroomCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-surface-2">
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT + '18' }}>
        <Icon name="add" size={22} color={ACCENT} />
      </View>
      <Text className="flex-1 text-base font-semibold" style={{ color: ACCENT }}>
        Add a toilet
      </Text>
    </Pressable>
  );
}
