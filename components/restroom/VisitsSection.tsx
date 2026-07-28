import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { SectionHeader } from '@/components/ui';

type Visit = { id: string; created_at: string; caption: string | null };

export function VisitsSection({ visits }: { visits: Visit[] }) {
  if (!visits.length) return null;
  return (
    <>
      <SectionHeader>Your visits here</SectionHeader>
      {visits.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => router.push(`/log/${v.id}`)}
          className="mb-2 flex-row items-center justify-between gap-2 rounded-xl bg-neutral-100 px-4 py-3 active:opacity-70 dark:bg-neutral-900">
          <Text className="flex-1 text-sm text-neutral-800 dark:text-neutral-200" numberOfLines={1}>
            {v.caption || 'A visit'}
          </Text>
          <Text className="text-xs text-neutral-400">{new Date(v.created_at).toLocaleDateString()}</Text>
        </Pressable>
      ))}
    </>
  );
}
