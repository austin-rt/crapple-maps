import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';

// Shared "Add a restroom" CTA, rendered atop the results list on both the native
// bottom-sheet and the web left-drawer so the two layouts never drift.
export function AddRestroomCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-dashed border-line p-3 active:opacity-70">
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT + '18' }}>
        <Ionicons name="add" size={22} color={ACCENT} />
      </View>
      <Text className="flex-1 text-base font-semibold" style={{ color: ACCENT }}>
        Add a restroom
      </Text>
    </Pressable>
  );
}
