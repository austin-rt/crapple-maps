import { Icon } from '@/components/ui';
import { router, Tabs } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebHeader } from '@/components/web/WebHeader';
import { useFollows } from '@/hooks/useFollows';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { ACCENT, useAuth } from '@/lib/auth';
import { useColors } from '@/lib/theme';
import { DANGER } from '@/lib/tokens';

export default function TabLayout() {
  const isMobileWeb = useIsMobileWeb();
  const c = useColors();
  const { session } = useAuth();
  const { requests } = useFollows(session?.user.id);
  // Desktop web hides the tab bar and shows a top header (hamburger nav + user
  // menu). Mobile web and native keep the bottom tab bar + per-screen headers.
  const webDesktop = Platform.OS === 'web' && !isMobileWeb;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: c.content2,
        tabBarButton: HapticTab,
        headerShown: true,
        tabBarStyle: webDesktop ? { display: 'none' } : { backgroundColor: c.surface, borderTopColor: c.line },
        ...(webDesktop ? { header: ({ options }: any) => <WebHeader title={options.title as string} /> } : null),
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Icon name="newspaper-outline" size={size} color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Search people" onPress={() => router.push('/people')} hitSlop={10}>
                <Icon name="search" size={22} color={c.content} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={requests.length ? `Notifications, ${requests.length} new` : 'Notifications'}
                onPress={() => router.push('/notifications')}
                hitSlop={10}>
                <Icon name="notifications-outline" size={22} color={c.content} />
                {requests.length > 0 ? (
                  <View
                    style={{ position: 'absolute', top: -5, right: -7, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{requests.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Log',
          tabBarIcon: ({ size }) => (
            <View style={{ width: size + 14, height: size + 4, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="add" size={size - 2} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
