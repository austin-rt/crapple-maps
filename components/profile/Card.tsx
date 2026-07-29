import { Text, View } from 'react-native';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-line p-4">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-2">{title}</Text>
      {children}
    </View>
  );
}
