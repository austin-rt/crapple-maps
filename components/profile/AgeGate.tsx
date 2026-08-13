import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { setAgeEligibleAt } from '@/lib/db/profiles';
import { useColors } from '@/lib/theme';
import { ACCENT, DANGER } from '@/lib/tokens';

const MIN_AGE = 13;

// The moment they turn MIN_AGE. Built with setFullYear rather than by adding
// milliseconds so leap years land on the real birthday.
export function eligibleDate(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day);
  d.setFullYear(d.getFullYear() + MIN_AGE);
  return d;
}

export function isValidDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  // Rejects 31 Feb and friends — JS rolls those over into the next month.
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// What the screens actually render: reads the profile itself so call sites
// stay a one-liner and don't each have to fetch and hand over the date.
export function AgeGateScreen({ uid }: { uid: string }) {
  const { data } = useProfile(uid);
  const eligibleAt = data?.age_eligible_at ? new Date(data.age_eligible_at) : undefined;
  const pending = eligibleAt && eligibleAt.getTime() > Date.now() ? eligibleAt : undefined;
  return <AgeGate eligibleAt={pending} />;
}

// Social surfaces only. Finding a restroom never reaches this.
export function AgeGate({ eligibleAt }: { eligibleAt?: Date }) {
  const { session, signOut } = useAuth();
  const qc = useQueryClient();
  const c = useColors();
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  // Already answered, just not old enough yet — nothing to re-enter, the block
  // lifts by itself.
  if (eligibleAt) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Icon name="time-outline" size={40} color={c.content2} />
        <Text className="mt-3 text-center text-xl font-semibold text-content">Not just yet</Text>
        <Text className="mt-2 text-center text-sm text-content-2">
          Logs, photos and following open up on{' '}
          {eligibleAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          , when you turn {MIN_AGE}. You can keep finding restrooms in the meantime.
        </Text>
        <Pressable onPress={signOut} className="mt-6 items-center py-2 active:opacity-70">
          <Text className="text-sm text-content-2">Sign out</Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    const m = parseInt(mm, 10);
    const d = parseInt(dd, 10);
    const y = parseInt(yyyy, 10);
    if (!isValidDate(y, m, d)) return setErr("That date doesn't look right.");
    const eligible = eligibleDate(y, m, d);
    // Sanity bound: a birth date implying >120 years is a typo, not a person.
    if (Date.now() - new Date(y, m - 1, d).getTime() > 120 * 365.25 * 864e5) {
      return setErr("That date doesn't look right.");
    }
    if (!session) return;
    setBusy(true);
    setErr(undefined);
    try {
      // Written whether or not they pass. If they're under 13 this is a future
      // date, which blocks them without a permanent ban and without letting
      // them retype their way past it.
      await setAgeEligibleAt(session.user.id, eligible);
      qc.invalidateQueries({ queryKey: ['profile', session.user.id] });
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save that. Try again.');
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
        <Text className="mt-3 text-center text-xl font-semibold text-content">One quick thing</Text>
        <Text className="mt-2 text-center text-sm text-content-2">
          Logs, photos and following are for people {MIN_AGE} and up. We only use this to check your
          age — we don&apos;t keep your birthday.
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
