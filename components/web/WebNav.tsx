import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { WebNavDrawer } from './WebNavDrawer';

// Global web hamburger + app-nav drawer, mounted once in the root layout.
// Hidden on the map route ('/'), which has its own hamburger inside the search.
export function WebNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (Platform.OS !== 'web' || path === '/') return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 40 }}>
      <Pressable
        onPress={() => setOpen(true)}
        className="items-center justify-center rounded-full bg-surface"
        style={[{ position: 'absolute', top: 14, left: 16, width: 44, height: 44 }, styles.shadow]}>
        <Ionicons name="menu" size={22} color="#6B7280" />
      </Pressable>
      <WebNavDrawer open={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
});
