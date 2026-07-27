import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'apple' | 'github';

type AuthState = {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithProvider: (provider: Provider) => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
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

// Single purple accent used for icons/map (styling elsewhere is Tailwind/NativeWind).
export const ACCENT = '#7C3AED';
