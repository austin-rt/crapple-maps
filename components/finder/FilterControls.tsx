import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { FILTERS, SORTS, type FilterKey, type SortKey } from '@/lib/restrooms/filters';
import { ACCENT } from '@/lib/tokens';

// The sort grid + filter chips, with no chrome of its own. Rendered inside the
// native bottom sheet (FilterSheet) and inline in the web results drawer, so the
// two never drift. Uses theme tokens so it lands right in light and dark.
export function FilterControls({
  sort,
  setSort,
  filters,
  toggleFilter,
}: {
  sort: SortKey;
  setSort: (s: SortKey) => void;
  filters: Partial<Record<FilterKey, boolean>>;
  toggleFilter: (k: FilterKey) => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-2">Sort by</Text>
      <View className="flex-row gap-2">
        {SORTS.map((s) => {
          const on = sort === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              className={`flex-1 items-center gap-1 rounded-2xl border py-3 ${on ? 'border-transparent' : 'border-line'}`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Ionicons name={s.icon as any} size={18} color={on ? '#fff' : '#6B7280'} />
              <Text className={on ? 'text-xs font-semibold text-white' : 'text-xs text-content-2'}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-content-2">Filters</Text>
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = !!filters[f.key];
          return (
            <Pressable
              key={f.key}
              onPress={() => toggleFilter(f.key)}
              className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 ${on ? 'border-transparent' : 'border-line'}`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Ionicons name={f.icon as any} size={15} color={on ? '#fff' : '#6B7280'} />
              <Text className={on ? 'text-sm font-semibold text-white' : 'text-sm text-content-2'}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
