import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UsernameGate } from '@/components/profile';
import { GetAppBanner } from '@/components/web/GetAppBanner';
import { WebHeader } from '@/components/web/WebHeader';
import { useApplyUpdates } from '@/hooks/useApplyUpdates';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { AuthProvider } from '@/lib/auth';
import { ContributionProvider } from '@/lib/contribution';
import { ThemePrefProvider, useColors, useThemePref } from '@/lib/theme';
import { AppToast } from '@/components/ui/AppToast';
import { ACCENT } from '@/lib/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

function NavStack() {
  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.classList.remove('prehydrate');
  }, []);

  // The apps open on Feed. '/' is the Map route (and the website's home page),
  // so a plain launch is sent to Feed once the navigator is ready; deep links
  // (invites, profiles) land where they point.
  const pathname = usePathname();
  const navReady = !!useRootNavigationState()?.key;
  const landed = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' || !navReady || landed.current) return;
    landed.current = true;
    if (pathname === '/') setTimeout(() => router.replace('/feed'), 0);
  }, [navReady, pathname]);
  const { scheme } = useThemePref();
  const c = useColors();
  const isMobileWeb = useIsMobileWeb();
  const webDesktop = Platform.OS === 'web' && !isMobileWeb;
  // Drive the navigation chrome (headers, screen backgrounds) from our palette
  // so it matches the token classes instead of react-navigation's own greys.
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: ACCENT, background: c.surface, card: c.surface, text: c.content, border: c.line },
  };
  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          // Desktop web: a persistent header on every pushed route (post,
          // add-restroom, people) with a back arrow + user menu. Mobile web and
          // native use the default stack header (plain back button).
          ...(webDesktop
            ? { header: ({ options, navigation, back }: any) => <WebHeader title={options.title as string} canGoBack={!!back} onBack={() => navigation.goBack()} /> }
            : null),
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="u/[username]" options={{ title: 'Profile' }} />
        <Stack.Screen name="my-map" options={{ title: 'Places I’ve Pooped' }} />
        <Stack.Screen name="map/[username]" options={{ title: 'Map' }} />
        <Stack.Screen name="follows" options={{ title: 'Follows' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useApplyUpdates();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePrefProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ContributionProvider>
                <GetAppBanner />
                <NavStack />
                <UsernameGate />
              </ContributionProvider>
            </AuthProvider>
          </QueryClientProvider>
          <AppToast />
        </ThemePrefProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
