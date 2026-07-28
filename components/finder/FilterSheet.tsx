import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeDownModal } from '@/components/ui';
import { type FilterKey, type SortKey } from '@/lib/restrooms/filters';
import { ACCENT } from '@/lib/tokens';

import { FilterControls } from './FilterControls';

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

        <FilterControls sort={sort} setSort={setSort} filters={filters} toggleFilter={toggleFilter} />

        <Pressable onPress={onClose} className="mt-6 items-center rounded-2xl py-3.5" style={{ backgroundColor: ACCENT }}>
          <Text className="text-base font-semibold text-white">{resultLabel}</Text>
        </Pressable>
      </View>
    </SwipeDownModal>
  );
}
