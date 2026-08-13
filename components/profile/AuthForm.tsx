import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MarkerBadge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

import { OAuthButtons } from './OAuthButtons';

const inputCls = 'rounded-xl border border-line px-4 py-3 text-content';

// Supabase states the password policy by dumping the literal character sets
// ("...at least one character of each: abcdefghijklmnopqrstuvwxyz, ABC...").
// Say the same thing in words. Keep this in sync with the project's auth
// config (password_min_length / password_required_characters).
const PASSWORD_HINT = 'At least 10 characters, with an uppercase letter, a lowercase letter, and a number.';

const prettyError = (e: string) => (e.toLowerCase().includes('password should') ? PASSWORD_HINT : e);

export function AuthForm() {
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

  const google = async () => {
    setBusy(true);
    setMsg(undefined);
    const { error } = await signInWithProvider('google');
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
    if (error) setMsg(prettyError(error));
  };

  const c = useColors();
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="gap-3 px-6 pt-20 pb-10"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <View className="mb-3 flex-row items-center gap-2.5">
        <MarkerBadge size={44} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="flex-1 font-extrabold text-content"
          style={{ fontSize: 36 }}>
          Crapple <Text style={{ color: ACCENT }}>Maps</Text>
        </Text>
      </View>
      <Text className="text-2xl font-bold text-content">
        {mode === 'in' ? 'Welcome back' : 'Create account'}
      </Text>
      <Text className="mb-2 text-content-2">Sign in to log visits, add restrooms, and follow friends.</Text>

      <OAuthButtons appleAvailable={appleAvailable} busy={busy} onApple={apple} onGoogle={google} />

      <View className="my-2 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-surface-3" />
        <Text className="text-xs text-content-2">or use email</Text>
        <View className="h-px flex-1 bg-surface-3" />
      </View>

      <View className="mb-2 flex-row gap-2">
        {(['in', 'up'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className={`flex-1 items-center rounded-xl border py-2 ${mode === m ? 'border-transparent' : 'border-line'}`}
            style={mode === m ? { backgroundColor: ACCENT } : undefined}>
            <Text className={`font-semibold ${mode === m ? 'text-white' : 'text-content-2'}`}>
              {m === 'in' ? 'Sign in' : 'Sign up'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor={c.content2}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        importantForAutofill="yes"
        className={inputCls}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={c.content2}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType={mode === 'in' ? 'password' : 'newPassword'}
        autoComplete={mode === 'in' ? 'password' : 'password-new'}
        importantForAutofill="yes"
        className={inputCls}
      />
      {/* State the rules up front on sign-up, but not twice if the error already says them. */}
      {mode === 'up' && msg !== PASSWORD_HINT ? (
        <Text className="text-xs text-content-2">{PASSWORD_HINT}</Text>
      ) : null}
      {msg ? <Text className="text-sm text-red-500">{msg}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy || !email || !password}
        className={`mt-1 items-center rounded-xl py-3 ${busy || !email || !password ? 'opacity-50' : ''}`}
        style={{ backgroundColor: ACCENT }}>
        <Text className="font-semibold text-white">{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Sign up'}</Text>
      </Pressable>

      {__DEV__ ? <Text className="mt-1 text-center text-xs text-content-2">Dev login: test / test</Text> : null}
    </ScrollView>
  );
}
