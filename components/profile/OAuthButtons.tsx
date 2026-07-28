import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text } from 'react-native';

import { GoogleG } from '@/components/ui';
import { useThemePref } from '@/lib/theme';

const btn = 'flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 py-3.5 active:opacity-70 dark:border-neutral-700';
const txt = 'font-semibold text-neutral-800 dark:text-neutral-100';

export function OAuthButtons({
  appleAvailable,
  busy,
  onApple,
  onGoogle,
}: {
  appleAvailable: boolean;
  busy: boolean;
  onApple: () => void;
  onGoogle: () => void;
}) {
  const { scheme } = useThemePref();
  return (
    <>
      {appleAvailable ? (
        <Pressable onPress={onApple} disabled={busy} className={`mb-2 ${btn} ${busy ? 'opacity-50' : ''}`}>
          <Ionicons name="logo-apple" size={18} color={scheme === 'dark' ? '#fff' : '#000'} />
          <Text className={txt}>Continue with Apple</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onGoogle} disabled={busy} className={`${btn} ${busy ? 'opacity-50' : ''}`}>
        <GoogleG size={18} />
        <Text className={txt}>Continue with Google</Text>
      </Pressable>
    </>
  );
}
