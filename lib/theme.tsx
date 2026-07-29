import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nwColorScheme } from 'nativewind';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useRNColorScheme } from 'react-native';

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'theme-pref';

type Ctx = { pref: ThemePref; setPref: (p: ThemePref) => void; scheme: 'light' | 'dark' };
const ThemeCtx = createContext<Ctx>({ pref: 'system', setPref: () => {}, scheme: 'light' });

// Persisted theme preference. Defaults to 'system' until a saved choice loads.
export function ThemePrefProvider({ children }: { children: React.ReactNode }) {
  const system = (useRNColorScheme() ?? 'light') as 'light' | 'dark';
  const [pref, setPrefState] = useState<ThemePref>('system');
  const scheme = pref === 'system' ? system : pref;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
  }, []);

  useEffect(() => {
    nwColorScheme.set(pref); // NativeWind honours 'system'
  }, [pref]);

  // Web: Tailwind darkMode:'class' needs a `dark` class on <html> for dark:
  // utilities to apply. NativeWind's 'system' mode doesn't add it on web, so the
  // page content stays light while the nav chrome (themed separately) goes dark.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);

  const setPref = (p: ThemePref) => {
    setPrefState(p);
    if (Platform.OS !== 'web') AsyncStorage.setItem(KEY, p);
  };
  return <ThemeCtx.Provider value={{ pref, setPref, scheme }}>{children}</ThemeCtx.Provider>;
}

export const useThemePref = () => useContext(ThemeCtx);

// Resolved semantic colors for the current scheme — the single source for style
// props (where a Tailwind class can't reach: sheet/nav backgrounds, icon colors,
// navigator options). Values MIRROR the CSS variables in global.css, so classes
// (bg-surface, text-content, border-line) and these stay in lockstep. Use these
// instead of inline hex or `scheme === 'dark' ? …` checks anywhere in the app.
export type ThemeColors = { surface: string; surface2: string; surface3: string; content: string; content2: string; line: string };

const COLORS: Record<'light' | 'dark', ThemeColors> = {
  light: { surface: '#ffffff', surface2: '#f5f6f8', surface3: '#e9e9ed', content: '#171717', content2: '#646c78', line: '#d1d5db' },
  dark: { surface: '#0a0a0c', surface2: '#17171b', surface3: '#26262c', content: '#fafafa', content2: '#a1a1aa', line: '#3f3f46' },
};

export function useColors(): ThemeColors {
  const { scheme } = useThemePref();
  return COLORS[scheme];
}
