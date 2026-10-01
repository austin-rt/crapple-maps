import { Pressable, Text } from 'react-native';

export function Stat({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label}`}
      className="flex-1 items-center active:opacity-60">
      <Text className="text-lg font-bold text-content">{value}</Text>
      <Text className="text-xs text-content-2">{label}</Text>
    </Pressable>
  );
}
