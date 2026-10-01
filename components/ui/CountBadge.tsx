import { Text, View } from 'react-native';

import { DANGER } from '@/lib/tokens';

// Red unread count pinned to the top-right corner of an icon.
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -5,
        right: -7,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        backgroundColor: DANGER,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
