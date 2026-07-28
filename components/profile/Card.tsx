import { Text, View } from 'react-native';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</Text>
      {children}
    </View>
  );
}
