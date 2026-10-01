import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast, { BaseToast, type BaseToastProps, type ToastConfig } from 'react-native-toast-message';

import { useColors } from '@/lib/theme';
import { ACCENT, DANGER, OPEN } from '@/lib/tokens';

// Mounted inside the safe-area and theme providers so it clears the notch or
// Dynamic Island and follows the light/dark choice; the library's defaults are
// a fixed 40pt offset and a white card.
export function AppToast() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  const card = (accent: string) =>
    function ThemedToast(props: BaseToastProps) {
      return (
        <BaseToast
          {...props}
          style={[styles.card, { borderLeftColor: accent, backgroundColor: c.surface2, borderColor: c.line }]}
          contentContainerStyle={styles.content}
          text1Style={[styles.title, { color: c.content }]}
          text2Style={[styles.body, { color: c.content2 }]}
          text1NumberOfLines={2}
          text2NumberOfLines={3}
        />
      );
    };

  const config: ToastConfig = { success: card(OPEN), error: card(DANGER), info: card(ACCENT) };

  return <Toast config={config} topOffset={insets.top + 8} bottomOffset={insets.bottom + 16} />;
}

const styles = StyleSheet.create({
  card: {
    height: 'auto',
    minHeight: 60,
    width: '92%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 5,
    paddingVertical: 10,
  },
  content: { paddingHorizontal: 14 },
  title: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 13 },
});
