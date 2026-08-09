import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Native Google Sign In. The browser flow works, but it hands the system an
// ASWebAuthenticationSession prompt naming the raw <ref>.supabase.co host —
// which reads like a phishing attempt to anyone signing in. Going through the
// Google SDK keeps the whole exchange on accounts.google.com.
//
// Lazy-required so a build without the native module (Expo Go, web) simply
// falls back to the browser flow instead of crashing at import time.
const GOOGLE_WEB_CLIENT_ID = '695514626699-fg9hknkju14gmh1s4o5f7fdi6a474hvc.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '695514626699-tqg7lg73fost9abje89abol08fbu7e64.apps.googleusercontent.com';

function loadGoogleSignIn() {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('@react-native-google-signin/google-signin');
    if (!mod?.GoogleSignin) return null;
    mod.GoogleSignin.configure({
      // Supabase validates the ID token against the WEB client, so it must be
      // the audience even on native.
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    return mod;
  } catch {
    return null;
  }
}

type Provider = 'google' | 'apple' | 'github';

type AuthState = {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithProvider: (provider: Provider) => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  changePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    loading,
    signInWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUpWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message };
    },
    signInWithProvider: async (provider) => {
      // Native path first for Google; falls through to the browser flow when
      // the module isn't in the build.
      if (provider === 'google') {
        const g = loadGoogleSignIn();
        if (g) {
          try {
            await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const res = await g.GoogleSignin.signIn();
            // v13+ returns {type, data}; older returns the user object directly.
            const idToken = res?.data?.idToken ?? res?.idToken;
            if (res?.type === 'cancelled') return {};
            if (!idToken) return { error: 'No Google identity token returned.' };
            const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
            return { error: error?.message };
          } catch (e: any) {
            // SIGN_IN_CANCELLED / user dismissed the sheet — not an error.
            if (e?.code === 'SIGN_IN_CANCELLED' || e?.code === '-5' || e?.code === '12501') return {};
            return { error: e?.message ?? 'Google sign-in failed.' };
          }
        }
      }
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: error.message };
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return {}; // user cancelled
      const { params, errorCode } = QueryParams.getQueryParams(res.url);
      if (errorCode) return { error: errorCode };
      const { access_token, refresh_token } = params;
      if (!access_token) return { error: 'No session returned' };
      const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
      return { error: setErr?.message };
    },
    // Native Apple Sign In (iOS). Requires expo-apple-authentication in the build
    // AND the Apple provider configured in Supabase (Service ID + key) to actually
    // authenticate. Lazy-required so the module's absence never crashes the app.
    signInWithApple: async () => {
      try {
        const AppleAuthentication = require('expo-apple-authentication');
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) return { error: 'No Apple identity token returned.' };
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
        return { error: error?.message };
      } catch (e: any) {
        if (e?.code === 'ERR_REQUEST_CANCELED') return {}; // user cancelled
        return { error: e?.message ?? 'Apple sign-in unavailable.' };
      }
    },
    changePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Re-exported for back-compat; the canonical definition now lives in lib/tokens.
export { ACCENT } from '@/lib/tokens';
