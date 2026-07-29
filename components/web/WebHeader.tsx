import { Icon } from '@/components/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

import { WebNavDrawer } from './WebNavDrawer';

// Rendered by the navigator's `header` slot so it stays put while content
// scrolls — it is NOT a repositioned drawer shell.
export function WebHeader({ title, canGoBack, onBack }: { title?: string; canGoBack?: boolean; onBack?: () => void }) {
  const c = useColors();
  const [navOpen, setNavOpen] = useState(false);
  const { session } = useAuth();
  const { data: me } = useProfile(session?.user.id ?? '');

  return (
    <>
      <View className="flex-row items-center border-b border-line bg-surface px-3" style={{ height: 56 }}>
        {canGoBack ? (
          <Pressable onPress={onBack} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-2">
            <Icon name="arrow-back" size={22} color={c.content2} />
          </Pressable>
        ) : (
          <Pressable onPress={() => setNavOpen(true)} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-2">
            <Icon name="menu" size={22} color={c.content2} />
          </Pressable>
        )}

        <Text className="ml-1.5 flex-1 text-lg font-bold text-content" numberOfLines={1}>
          {title ? (
            title
          ) : (
            <>
              Crapple <Text style={{ color: ACCENT }}>Maps</Text>
            </>
          )}
        </Text>

        <Pressable onPress={() => router.push('/profile')} className="h-9 w-9 items-center justify-center overflow-hidden rounded-full">
          {session ? (
            <Avatar seed={me?.avatar_seed || me?.username || session.user.id} size={36} />
          ) : (
            <Icon name="person-circle-outline" size={30} color={c.content2} />
          )}
        </Pressable>
      </View>

      <WebNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}
