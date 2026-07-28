import Toast from 'react-native-toast-message';

// Thin wrapper over react-native-toast-message so every action reports the same way.
export const toast = {
  success: (text1: string, text2?: string) => Toast.show({ type: 'success', text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: 'error', text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: 'info', text1, text2 }),
};
