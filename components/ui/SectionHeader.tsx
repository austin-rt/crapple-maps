import { Text } from 'react-native';

export function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-content-2">
      {children}
    </Text>
  );
}
