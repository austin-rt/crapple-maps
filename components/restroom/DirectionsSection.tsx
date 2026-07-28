import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { SectionHeader } from '@/components/ui';
import { ACCENT } from '@/lib/tokens';

// View-mode display of saved directions (edit mode uses EditForm instead).
export function DirectionsSection({ directions }: { directions: string | null | undefined }) {
  if (!directions) return null;
  return (
    <>
      <SectionHeader>How to find it</SectionHeader>
      <View className="flex-row items-start gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
        <Ionicons name="navigate-circle-outline" size={18} color={ACCENT} style={{ marginTop: 1 }} />
        <Text className="flex-1 text-[15px] leading-5 text-neutral-800 dark:text-neutral-200">{directions}</Text>
      </View>
    </>
  );
}
