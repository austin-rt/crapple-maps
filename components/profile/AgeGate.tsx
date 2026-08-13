import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { MIN_AGE, checkDob } from '@/lib/age';
import { useColors } from '@/lib/theme';
import { ACCENT, DANGER } from '@/lib/tokens';

const KEY = 'age-ok';

// A neutral age screen in front of the whole auth surface — email sign-in,
// sign-up, Google and Apple alike.
//
// It has to sit BEFORE auth rather than after it, because Google and Apple
// create the account the moment the user authenticates and Supabase has no
// "sign in but don't create" flag for OAuth. Checking afterwards would mean
// creating a child's account and then deleting it. Checking here means it is
// never created and no email ever leaves the device.
//
// The pass flag is local-only, on purpose: nothing about the user's age is sent
// anywhere, and the date of birth itself is never stored at all.
export function useAgePassed() {
  const [passed, setPassed] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setPassed(v === '1'))
      .catch(() => setPassed(false));
  }, []);
  return [passed, setPassed] as const;
}

export function AgeGate({ onPass }: { onPass: () => void }) {
  const c = useColors();
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [err, setErr] = useState<string | undefined>();

  const submit = async () => {
    const res = checkDob(mm, dd, yyyy);
    if (!res.ok) {
      return setErr(
        res.reason === 'under'
          ? `You need to be ${MIN_AGE} or older for an account. You can keep finding restrooms without one.`
          : "That date doesn't look right.",
      );
    }
    await AsyncStorage.setItem(KEY, '1');
    onPass();
  };

  return (
    <View className="flex-1 justify-center bg-surface px-8">
      <View className="items-center">
        <Icon name="lock-closed-outline" size={40} color={c.content2} />
        <Text className="mt-3 text-center text-xl font-semibold text-content">
          What&apos;s your date of birth?
        </Text>
        <Text className="mt-2 text-center text-sm text-content-2">
          Accounts — logs, photos and following — are for people {MIN_AGE} and up. This stays on
          your device; we don&apos;t send it anywhere or save it.
        </Text>
      </View>

      <View className="mt-6 flex-row gap-2">
        <TextInput
          value={mm}
          onChangeText={(t) => setMm(t.replace(/[^0-9]/g, ''))}
          placeholder="MM"
          placeholderTextColor={c.content2}
          keyboardType="number-pad"
          maxLength={2}
          style={{ flex: 1 }}
          className="rounded-xl border border-line px-4 py-3 text-center text-base text-content"
        />
        <TextInput
          value={dd}
          onChangeText={(t) => setDd(t.replace(/[^0-9]/g, ''))}
          placeholder="DD"
          placeholderTextColor={c.content2}
          keyboardType="number-pad"
          maxLength={2}
          style={{ flex: 1 }}
          className="rounded-xl border border-line px-4 py-3 text-center text-base text-content"
        />
        <TextInput
          value={yyyy}
          onChangeText={(t) => setYyyy(t.replace(/[^0-9]/g, ''))}
          placeholder="YYYY"
          placeholderTextColor={c.content2}
          keyboardType="number-pad"
          maxLength={4}
          style={{ flex: 1.6 }}
          className="rounded-xl border border-line px-4 py-3 text-center text-base text-content"
        />
      </View>

      {err ? (
        <Text className="mt-3 text-center text-sm" style={{ color: DANGER }}>
          {err}
        </Text>
      ) : null}

      <Pressable
        onPress={submit}
        className="mt-6 items-center rounded-xl py-4 active:opacity-80"
        style={{ backgroundColor: ACCENT }}>
        <Text className="text-base font-semibold text-white">Continue</Text>
      </Pressable>
    </View>
  );
}
