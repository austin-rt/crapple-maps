import { Icon } from '@/components/ui';
import { Pressable, Text } from 'react-native';

import { GoogleG } from '@/components/ui';
import { useColors } from '@/lib/theme';

const btn = 'flex-row items-center justify-center gap-2 rounded-xl border border-line py-3.5 active:opacity-70';
const txt = 'font-semibold text-content';

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
  const c = useColors();
  return (
    <>
      {appleAvailable ? (
        <Pressable onPress={onApple} disabled={busy} className={`mb-2 ${btn} ${busy ? 'opacity-50' : ''}`}>
          <Icon name="logo-apple" size={18} color={c.content} />
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
