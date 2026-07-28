import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeDownModal } from '@/components/ui';
import { FILTERS, SORTS, type FilterKey, type SortKey } from '@/lib/restrooms/filters';
import { ACCENT } from '@/lib/tokens';

export function FilterSheet({
  visible,
  onClose,
  sort,
  setSort,
  filters,
  toggleFilter,
  clearFilters,
  resultLabel,
}: {
  visible: boolean;
  onClose: () => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  filters: Partial<Record<FilterKey, boolean>>;
  toggleFilter: (k: FilterKey) => void;
  clearFilters: () => void;
  resultLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const activeCount = Object.values(filters).filter(Boolean).length;
  return (
    <SwipeDownModal visible={visible} onClose={onClose}>
      <View className="rounded-t-3xl bg-white px-5 pt-3 dark:bg-neutral-900" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Sort & filter</Text>
          {activeCount > 0 ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Clear all</Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Sort by</Text>
        <View className="flex-row gap-2">
          {SORTS.map((s) => {
            const on = sort === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                className={`flex-1 items-center gap-1 rounded-2xl border py-3 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                style={on ? { backgroundColor: ACCENT } : undefined}>
                <Ionicons name={s.icon as any} size={18} color={on ? '#fff' : '#6B7280'} />
                <Text className={on ? 'text-xs font-semibold text-white' : 'text-xs text-neutral-600 dark:text-neutral-300'}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Filters</Text>
        <View className="flex-row flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = !!filters[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => toggleFilter(f.key)}
                className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                style={on ? { backgroundColor: ACCENT } : undefined}>
                <Ionicons name={f.icon as any} size={15} color={on ? '#fff' : '#6B7280'} />
                <Text className={on ? 'text-sm font-semibold text-white' : 'text-sm text-neutral-700 dark:text-neutral-300'}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={onClose} className="mt-6 items-center rounded-2xl py-3.5" style={{ backgroundColor: ACCENT }}>
          <Text className="text-base font-semibold text-white">{resultLabel}</Text>
        </Pressable>
      </View>
    </SwipeDownModal>
  );
}
