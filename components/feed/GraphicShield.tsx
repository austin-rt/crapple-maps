import { type ReactNode, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';

// Logs the viewer chose to see this session, shared so a post revealed in the
// feed stays revealed on its post screen and map sheet.
const revealed = new Set<string>();
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const reveal = (logId: string) => {
  revealed.add(logId);
  listeners.forEach((fn) => fn());
};

const BLUR = 90;

// Wraps a log's photos. When the poster marked them graphic, the children get a
// blur radius and a cover until the viewer taps Show. `compact` is for
// thumbnails: an icon only, and taps fall through to the row underneath.
export function GraphicShield({
  logId,
  graphic,
  radius = 0,
  compact = false,
  style,
  children,
}: {
  logId: string;
  graphic: boolean;
  radius?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  children: (blurRadius: number) => ReactNode;
}) {
  const seen = useSyncExternalStore(subscribe, () => revealed.has(logId), () => false);
  const { session } = useAuth();
  const { data: me } = useProfile(session?.user.id ?? '');
  const hidden = graphic && !seen && !me?.show_sensitive;
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius }, style]}>
      {children(hidden ? BLUR : 0)}
      {hidden && compact ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cover]}>
          <Icon name="eye-off-outline" size={18} color="#fff" />
        </View>
      ) : hidden ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show sensitive content"
          onPress={() => reveal(logId)}
          style={[StyleSheet.absoluteFill, styles.cover]}>
          <Icon name="eye-off-outline" size={30} color="#fff" />
          <Text style={styles.title}>Sensitive content</Text>
          <Text style={styles.body}>The poster flagged this as graphic.</Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Show</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  title: { marginTop: 8, color: '#fff', fontSize: 16, fontWeight: '600' },
  body: { marginTop: 2, color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
  button: { marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 16, paddingVertical: 6 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
