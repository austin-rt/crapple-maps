import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ACCENT } from '@/lib/tokens';

// Shared pull-to-refresh for every scrolling screen: refetches every query the
// visible screens are using, so each screen reloads what it shows without
// wiring its own refresh. `control` is for ScrollView / FlatList;
// `refreshing` + `onRefresh` are for bottom-sheet lists, which take the props
// directly.
export function usePullToRefresh() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await qc.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [qc]);
  const control = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />;
  return { refreshing, onRefresh, control };
}
