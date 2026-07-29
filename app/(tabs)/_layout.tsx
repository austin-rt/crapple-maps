import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebHeader } from '@/components/web/WebHeader';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { ACCENT } from '@/lib/auth';
import { useThemePref } from '@/lib/theme';

export default function TabLayout() {
  const isMobileWeb = useIsMobileWeb();
  const { scheme } = useThemePref();
  const dark = scheme === 'dark';
  // Desktop web hides the tab bar and shows a top header (hamburger nav + user
  // menu). Mobile web and native keep the bottom tab bar + per-screen headers.
  const webDesktop = Platform.OS === 'web' && !isMobileWeb;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: dark ? '#8b8b93' : undefined,
        tabBarButton: HapticTab,
        headerShown: true,
        tabBarStyle: webDesktop
          ? { display: 'none' }
          : { backgroundColor: dark ? '#0a0a0c' : '#ffffff', borderTopColor: dark ? '#1c1c1f' : '#e5e7eb' },
        ...(webDesktop ? { header: ({ options }: any) => <WebHeader title={options.title as string} /> } : null),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} />,
          headerRight: () => (
            <Pressable onPress={() => router.push('/people')} hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="person-add-outline" size={22} color={ACCENT} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size + 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-map"
        options={{
          title: 'My Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="trail-sign-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
