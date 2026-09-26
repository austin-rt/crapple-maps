import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { INPUT_CLS } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { updateProfile } from '@/lib/db/profiles';
import { toast } from '@/lib/toast';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

const VALID = /^[a-z0-9_]{3,30}$/;

// One-time step after sign-up (or after a handle was randomized): new
// accounts get a random handle so no real name leaks from the email, and this
// asks the person to keep it or pick their own before carrying on.
export function UsernameGate() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';
  const { data: profile } = useProfile(uid);
  const qc = useQueryClient();
  const c = useColors();
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
  }, [profile?.username]);

  if (!uid || !profile || profile.username_chosen !== false) return null;

  const valid = VALID.test(username);
  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await updateProfile(uid, username === profile.username ? { username_chosen: true } : { username, username_chosen: true });
      await qc.invalidateQueries({ queryKey: ['profile', uid] });
    } catch (e: any) {
      toast.error(e?.code === '23505' ? 'That username is taken' : "Couldn't save username", e?.code === '23505' ? 'Try a different one.' : e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={() => {}}>
      <View className="flex-1 justify-center bg-surface px-8">
        <Text className="text-2xl font-bold text-content">Pick your username</Text>
        <Text className="mt-2 text-content-2">
          This is how friends find and follow you. We gave you a random one so your real name stays private — keep it or make it yours.
        </Text>
        <View className="mt-6 flex-row items-center">
          <Text className="mr-1 text-lg text-content-2">@</Text>
          <TextInput
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            placeholder="username"
            placeholderTextColor={c.content2}
            className={INPUT_CLS}
            style={{ flex: 1, minWidth: 0 }}
          />
        </View>
        <Text className="mt-2 text-xs text-content-2">3–30 lowercase letters, numbers or underscores.</Text>
        <Pressable
          onPress={save}
          disabled={!valid || saving}
          accessibilityRole="button"
          className={`mt-6 items-center rounded-xl py-4 ${!valid || saving ? 'opacity-50' : ''}`}
          style={{ backgroundColor: ACCENT }}>
          <Text className="text-base font-semibold text-white">{saving ? 'Saving…' : 'Continue'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
