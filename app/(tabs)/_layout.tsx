import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebHeader } from '@/components/web/WebHeader';
import { ACCENT } from '@/lib/auth';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT,
        tabBarButton: HapticTab,
        headerShown: true,
        // Web hides the bottom tab bar and shows a persistent top header (with
        // the hamburger nav + user menu) instead — except on the map (below).
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : undefined,
        ...(Platform.OS === 'web' ? { header: ({ options }: any) => <WebHeader title={options.title as string} /> } : null),
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
