import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { WebHeader } from '@/components/web/WebHeader';
import { AuthProvider } from '@/lib/auth';
import { ContributionProvider } from '@/lib/contribution';
import { ThemePrefProvider, useThemePref } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

function NavStack() {
  const { scheme } = useThemePref();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          // Web: a persistent header on every pushed route (post, add-restroom,
          // people) with a back arrow + user menu. The (tabs) group keeps its
          // own headers (below), and the map opts out entirely.
          ...(Platform.OS === 'web'
            ? { header: ({ options, navigation, back }: any) => <WebHeader title={options.title as string} canGoBack={!!back} onBack={() => navigation.goBack()} /> }
            : null),
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePrefProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ContributionProvider>
                <NavStack />
              </ContributionProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemePrefProvider>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
