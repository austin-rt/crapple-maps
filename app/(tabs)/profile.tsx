import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ACCENT, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useThemePref, type ThemePref } from '@/lib/theme';

/* ------------------------- signed-out: auth form ------------------------- */

function AuthForm() {
  const { signInWithEmail, signUpWithEmail, signInWithProvider, signInWithApple } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    try {
      require('expo-apple-authentication').isAvailableAsync().then(setAppleAvailable).catch(() => {});
    } catch {}
  }, []);

  const apple = async () => {
    setBusy(true);
    setMsg(undefined);
    const { error } = await signInWithApple();
    setBusy(false);
    if (error) setMsg(error);
  };

  const submit = async () => {
    setBusy(true);
    setMsg(undefined);
    const raw = email.trim();
    // Dev-only convenience (never in published builds): bare username → @test.com,
    // and the seeded test/test account signs in regardless of the typed password.
    const normalizedEmail = __DEV__ && !raw.includes('@') ? `${raw}@test.com` : raw;
    const pw = __DEV__ && mode === 'in' && normalizedEmail === 'test@test.com' ? 'testtest' : password;
    const fn = mode === 'in' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(normalizedEmail, pw);
    setBusy(false);
    if (error) setMsg(error);
  };

  const google = async () => {
    setBusy(true);
    setMsg(undefined);
    const { error } = await signInWithProvider('google');
    setBusy(false);
    if (error) setMsg(error);
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-3 px-6 pt-20 pb-10"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {mode === 'in' ? 'Welcome back' : 'Create account'}
      </Text>
      <Text className="mb-2 text-neutral-500 dark:text-neutral-400">
        Sign in to log visits, add restrooms, and follow friends.
      </Text>

      {/* OAuth first — Apple (iOS) then Google */}
      {appleAvailable ? (
        <Pressable
          onPress={apple}
          disabled={busy}
          className={`flex-row items-center justify-center gap-2 rounded-xl bg-black py-3.5 active:opacity-80 ${busy ? 'opacity-50' : ''}`}>
          <Ionicons name="logo-apple" size={18} color="#fff" />
          <Text className="font-semibold text-white">Continue with Apple</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={google}
        disabled={busy}
        className={`flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 py-3.5 active:opacity-70 dark:border-neutral-700 ${busy ? 'opacity-50' : ''}`}>
        <Ionicons name="logo-google" size={18} color="#9CA3AF" />
        <Text className="font-semibold text-neutral-800 dark:text-neutral-100">Continue with Google</Text>
      </Pressable>

      <View className="my-2 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <Text className="text-xs text-neutral-400">or use email</Text>
        <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </View>

      {/* email/password form below */}
      <View className="mb-2 flex-row gap-2">
        {(['in', 'up'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className={`flex-1 items-center rounded-xl border py-2 ${
              mode === m ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'
            }`}
            style={mode === m ? { backgroundColor: ACCENT } : undefined}>
            <Text className={`font-semibold ${mode === m ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {m === 'in' ? 'Sign in' : 'Sign up'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
      />
      {msg ? <Text className="text-sm text-red-500">{msg}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy || !email || !password}
        className={`mt-1 items-center rounded-xl py-3 ${busy || !email || !password ? 'opacity-50' : ''}`}
        style={{ backgroundColor: ACCENT }}>
        <Text className="font-semibold text-white">
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Sign up'}
        </Text>
      </Pressable>

      {__DEV__ ? <Text className="mt-1 text-center text-xs text-neutral-400">Dev login: test / test</Text> : null}
    </ScrollView>
  );
}

/* ------------------------- signed-in: manage profile ------------------------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

const THEME_OPTS: { key: ThemePref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

function AppearanceCard() {
  const { pref, setPref } = useThemePref();
  return (
    <Card title="Appearance">
      <View className="flex-row gap-2">
        {THEME_OPTS.map(({ key, label, icon }) => {
          const on = pref === key;
          return (
            <Pressable
              key={key}
              onPress={() => setPref(key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${
                on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'
              }`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Ionicons name={icon} size={15} color={on ? '#fff' : '#9CA3AF'} />
              <Text className={on ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{value}</Text>
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
    </View>
  );
}

const inputCls =
  'rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50';

function ManageProfile() {
  const { session, signOut } = useAuth();
  const qc = useQueryClient();
  const uid = session!.user.id;

  const { data: profile } = useQuery({
    queryKey: ['profile', uid],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, avatar_seed, followers_count, following_count, logs_count')
        .eq('id', uid)
        .single();
      return data;
    },
  });

  const { data: logCount = 0 } = useQuery({
    queryKey: ['my-log-count', uid],
    queryFn: async () => {
      const { count } = await supabase.from('logs').select('id', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
    }
  }, [profile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', uid);
    setSavingProfile(false);
    if (error) return Alert.alert('Error', error.message);
    qc.invalidateQueries({ queryKey: ['profile', uid] });
    Alert.alert('Saved', 'Your profile was updated.');
  };

  const changePw = async () => {
    if (newPw.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) return Alert.alert('Error', error.message);
    setNewPw('');
    Alert.alert('Done', 'Password changed.');
  };

  const shuffle = async () => {
    const seed = `${uid.slice(0, 8)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
    const { error } = await supabase.from('profiles').update({ avatar_seed: seed, avatar_url: null }).eq('id', uid);
    if (error) return Alert.alert('Error', error.message);
    qc.invalidateQueries({ queryKey: ['profile', uid] });
  };

  const uploadPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    try {
      const arraybuffer = await fetch(res.assets[0].uri).then((r) => r.arrayBuffer());
      const path = `${uid}/avatar_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', uid);
      qc.invalidateQueries({ queryKey: ['profile', uid] });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? String(e));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      {/* header */}
      <View className="items-center pt-8">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={{ width: 84, height: 84, borderRadius: 42 }}
            className="bg-neutral-200 dark:bg-neutral-800"
          />
        ) : (
          <Avatar seed={profile?.avatar_seed || profile?.username || uid} size={84} />
        )}
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={uploadPhoto}
            className="flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 active:opacity-70 dark:border-neutral-700">
            <Ionicons name="camera-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Upload photo</Text>
          </Pressable>
          <Pressable
            onPress={shuffle}
            className="flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 active:opacity-70 dark:border-neutral-700">
            <Ionicons name="shuffle" size={14} color="#9CA3AF" />
            <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Shuffle</Text>
          </Pressable>
        </View>
        <Text className="mt-3 text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {profile?.display_name || profile?.username || 'You'}
        </Text>
        {profile?.username ? (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">@{profile.username}</Text>
        ) : null}
        <Text className="mt-0.5 text-xs text-neutral-400">{session!.user.email}</Text>
      </View>

      {/* stats */}
      <View className="mt-6 flex-row rounded-2xl border border-neutral-200 py-4 dark:border-neutral-800">
        <Stat label="Logs" value={logCount} />
        <View className="w-px bg-neutral-200 dark:bg-neutral-800" />
        <Stat label="Followers" value={profile?.followers_count ?? 0} />
        <View className="w-px bg-neutral-200 dark:bg-neutral-800" />
        <Stat label="Following" value={profile?.following_count ?? 0} />
      </View>

      {/* appearance — first thing after the stats */}
      <AppearanceCard />

      {/* profile + account — one section */}
      <Card title="Profile & account">
        <Text className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">Display name</Text>
        <TextInput
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
          className={inputCls}
        />
        <Pressable
          onPress={saveProfile}
          disabled={savingProfile}
          className={`mt-3 items-center rounded-xl py-3 ${savingProfile ? 'opacity-50' : ''}`}
          style={{ backgroundColor: ACCENT }}>
          <Text className="font-semibold text-white">{savingProfile ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>

        <View className="my-4 h-px bg-neutral-200 dark:bg-neutral-800" />

        <Text className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">New password</Text>
        <TextInput
          placeholder="••••••"
          placeholderTextColor="#9CA3AF"
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry
          className={inputCls}
        />
        <Pressable
          onPress={changePw}
          disabled={savingPw || !newPw}
          className={`mt-3 items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700 ${
            savingPw || !newPw ? 'opacity-50' : ''
          }`}>
          <Text className="font-semibold text-neutral-900 dark:text-neutral-100">
            {savingPw ? 'Updating…' : 'Change password'}
          </Text>
        </Pressable>
      </Card>

      <Pressable
        onPress={() => signOut()}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-red-300 py-3 active:opacity-70 dark:border-red-900">
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  return session ? <ManageProfile /> : <AuthForm />;
}
