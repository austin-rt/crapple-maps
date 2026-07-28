import { Alert, Platform } from 'react-native';

// Cross-platform notify/confirm. RN's Alert is a no-op on web, so fall back to
// the browser's window.alert/confirm there.

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  {
    confirmLabel = 'OK',
    destructive = false,
    onCancel,
  }: { confirmLabel?: string; destructive?: boolean; onCancel?: () => void } = {},
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    else onCancel?.();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  }
}
