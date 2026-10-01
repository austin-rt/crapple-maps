import { Text, View } from 'react-native';

import { DANGER } from '@/lib/tokens';

// Red unread count, pinned to an icon's top-right corner or, inline, pushed to
// the end of a row.
export function CountBadge({ count, inline }: { count: number; inline?: boolean }) {
  if (count <= 0) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        inline ? { marginLeft: 'auto' } : { position: 'absolute', top: -5, right: -7 },
        {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
          backgroundColor: DANGER,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
