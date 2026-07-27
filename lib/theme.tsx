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

  useEffect(() => {
    if (Platform.OS === 'web') return;
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
  }, []);

  useEffect(() => {
    nwColorScheme.set(pref); // NativeWind honours 'system'
  }, [pref]);

  const setPref = (p: ThemePref) => {
    setPrefState(p);
    if (Platform.OS !== 'web') AsyncStorage.setItem(KEY, p);
  };

  const scheme = pref === 'system' ? system : pref;
  return <ThemeCtx.Provider value={{ pref, setPref, scheme }}>{children}</ThemeCtx.Provider>;
}

export const useThemePref = () => useContext(ThemeCtx);
