import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { setAgeVerified } from '@/lib/db/profiles';
import { useColors } from '@/lib/theme';
import { ACCENT, DANGER } from '@/lib/tokens';

const MIN_AGE = 13;

// Whole years elapsed, not a day-count divided by 365 — that drifts across leap
// years and can land someone on the wrong side of their own birthday.
export function ageFrom(year: number, month: number, day: number, now = new Date()) {
  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isValidDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  // Rejects 31 Feb and friends — JS rolls those over to the next month.
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// Shown once per account, on the social surfaces only. Finding a restroom never
// reaches this — that stays open to everyone, signed in or not.
export function AgeGate() {
  const { session, signOut } = useAuth();
  const qc = useQueryClient();
  const c = useColors();
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const submit = async () => {
    const m = parseInt(mm, 10);
    const d = parseInt(dd, 10);
    const y = parseInt(yyyy, 10);
    if (!isValidDate(y, m, d)) return setErr("That date doesn't look right.");
    const age = ageFrom(y, m, d);
    if (age > 120) return setErr("That date doesn't look right.");
    if (age < MIN_AGE) {
      return setErr(
        `You need to be ${MIN_AGE} or older to use the social features. You can still find restrooms without an account.`,
      );
    }
    if (!session) return;
    setBusy(true);
    setErr(undefined);
    try {
      await setAgeVerified(session.user.id);
      qc.invalidateQueries({ queryKey: ['profile', session.user.id] });
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save that. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const Box = ({
    value,
    onChangeText,
    placeholder,
    maxLength,
    flex,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    maxLength: number;
    flex: number;
  }) => (
    <TextInput
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
      placeholder={placeholder}
      placeholderTextColor={c.content2}
      keyboardType="number-pad"
      maxLength={maxLength}
      style={{ flex }}
      className="rounded-xl border border-line px-4 py-3 text-center text-base text-content"
    />
  );

  return (
    <View className="flex-1 justify-center bg-surface px-8">
      <View className="items-center">
        <Icon name="lock-closed-outline" size={40} color={c.content2} />
        <Text className="mt-3 text-center text-xl font-semibold text-content">
          One quick thing
        </Text>
        <Text className="mt-2 text-center text-sm text-content-2">
          Logs, photos and following are for people {MIN_AGE} and up. Confirm your date of birth to
          use them. We don&apos;t store it.
        </Text>
      </View>

      <View className="mt-6 flex-row gap-2">
        <Box value={mm} onChangeText={setMm} placeholder="MM" maxLength={2} flex={1} />
        <Box value={dd} onChangeText={setDd} placeholder="DD" maxLength={2} flex={1} />
        <Box value={yyyy} onChangeText={setYyyy} placeholder="YYYY" maxLength={4} flex={1.6} />
      </View>

      {err ? (
        <Text className="mt-3 text-center text-sm" style={{ color: DANGER }}>
          {err}
        </Text>
      ) : null}

      <Pressable
        onPress={submit}
        disabled={busy}
        className={`mt-6 items-center rounded-xl py-4 ${busy ? 'opacity-50' : 'active:opacity-80'}`}
        style={{ backgroundColor: ACCENT }}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Continue</Text>
        )}
      </Pressable>

      <Pressable onPress={signOut} className="mt-4 items-center py-2 active:opacity-70">
        <Text className="text-sm text-content-2">Sign out</Text>
      </Pressable>
    </View>
  );
}
