import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// Empty state for auth-gated screens — sends people straight to sign in / up.
export function SignInRequired({
  icon = 'lock-closed-outline',
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  const c = useColors();
  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Ionicons name={icon} size={40} color={c.content2} />
      <Text className="mt-3 text-center text-lg text-content-2">{message}</Text>
      <Pressable
        onPress={() => router.navigate('/(tabs)/profile')}
        className="mt-5 rounded-xl px-6 py-3 active:opacity-80"
        style={{ backgroundColor: ACCENT }}>
        <Text className="text-base font-semibold text-white">Sign in or sign up</Text>
      </Pressable>
    </View>
  );
}
