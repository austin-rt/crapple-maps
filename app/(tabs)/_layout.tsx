import { Icon } from '@/components/ui';
import { CountBadge } from '@/components/ui/CountBadge';
import { router, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebHeader } from '@/components/web/WebHeader';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { ACCENT, useAuth } from '@/lib/auth';
import { useColors } from '@/lib/theme';
import { DANGER } from '@/lib/tokens';

export default function TabLayout() {
  const isMobileWeb = useIsMobileWeb();
  const c = useColors();
  const { session } = useAuth();
  const unread = useUnreadCount(session?.user.id);
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
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: DANGER, color: '#fff', fontSize: 10 },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Search people" onPress={() => router.push('/people')} hitSlop={10}>
                <Icon name="search" size={22} color={c.content} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={unread ? `Notifications, ${unread} new` : 'Notifications'}
                onPress={() => router.push('/notifications')}
                hitSlop={10}>
                <Icon name="notifications-outline" size={22} color={c.content} />
                <CountBadge count={unread} />
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
          title: 'Drop a log',
          tabBarIcon: ({ color, size }) => <Icon name="add-circle" size={size + 2} color={color} />,
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
