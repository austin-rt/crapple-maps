import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddRestroomCard, FilterSheet, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { Avatar } from '@/components/ui';
import { WebNavDrawer } from '@/components/web/WebNavDrawer';
import { DEFAULT_REGION, VISITED, useFinder } from '@/hooks/useFinder';
import { useProfile } from '@/hooks/useProfile';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel } from '@/lib/restrooms/filters';
import { useThemePref } from '@/lib/theme';
import { ACCENT, MUTED } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// Web map page — Google-Maps-style layout: full-bleed map, a collapsible left
// drawer (search + results), hamburger app-nav, and a top-right filter + avatar.
export default function MapWeb() {
  const { scheme } = useThemePref();
  const f = useFinder();
  const { data: me } = useProfile(f.session?.user.id ?? '');
  const [navOpen, setNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(drawerX, { toValue: drawerOpen ? 0 : -428, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [drawerOpen, drawerX]);

  return (
    <View className="flex-1 bg-surface">
      <AppMapView
        ref={f.mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        onLongPress={(e: any) => {
          const c = e?.nativeEvent?.coordinate;
          if (c) f.addRestroomAt({ lat: c.latitude, lng: c.longitude });
        }}
        onPress={() => {
          if (Date.now() - f.markerTapRef.current < 500) return;
          f.setSelected(null);
        }}
        initialRegion={DEFAULT_REGION}>
        {f.list.map((item) => (
          <AppMarker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            pinColor={item.id === f.activeId ? '#DC2626' : f.loggedIds?.has(item.id) ? VISITED : ACCENT}
            onPress={() => f.select(item)}
          />
        ))}
      </AppMapView>

      {/* top-right: account only, pinned right */}
      <View style={{ position: 'absolute', top: 14, right: 16, zIndex: 20 }}>
        <Pressable onPress={() => router.push('/profile')} className="items-center justify-center overflow-hidden rounded-full bg-surface" style={[{ width: 44, height: 44 }, styles.shadow]}>
          {f.session ? <Avatar seed={me?.avatar_seed || me?.username || f.session.user.id} size={40} /> : <Ionicons name="person-circle-outline" size={30} color="#4B5563" />}
        </Pressable>
      </View>

      {/* left drawer: search + results (animated slide) */}
      <Animated.View pointerEvents={drawerOpen ? 'auto' : 'none'} className="bg-surface" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 408, zIndex: 10, transform: [{ translateX: drawerX }] }, styles.shadow]}>
          <View style={{ padding: 12, paddingTop: 14 }}>
            <View className="flex-row items-center rounded-full bg-surface-2 pl-1 pr-1">
              <Pressable onPress={() => setNavOpen(true)} className="items-center justify-center" style={{ width: 42, height: 42 }}>
                <Ionicons name="menu" size={22} color="#6B7280" />
              </Pressable>
              <TextInput
                placeholder="Search address, city, or ZIP…"
                placeholderTextColor={MUTED}
                value={f.query}
                onChangeText={f.setQuery}
                autoCapitalize="words"
                className="flex-1 px-1 py-2.5 text-base text-content"
              />
              {f.searching ? (
                <ActivityIndicator size="small" color={MUTED} style={{ marginRight: 4 }} />
              ) : f.query.length > 0 ? (
                <Pressable onPress={() => f.setQuery('')} className="px-1">
                  <Ionicons name="close-circle" size={18} color={MUTED} />
                </Pressable>
              ) : null}
              <View className="mx-0.5 h-5 w-px bg-line" />
              <Pressable onPress={() => f.setFilterOpen(true)} className="items-center justify-center" style={{ width: 40, height: 40 }}>
                <Ionicons name="options" size={20} color={f.activeFilterCount ? ACCENT : '#6B7280'} />
              </Pressable>
            </View>

            {f.results.length > 0 ? (
              <View className="mt-1.5 overflow-hidden rounded-xl bg-surface" style={styles.shadow}>
                {f.results.map((p, i) => (
                  <Pressable
                    key={`${p.lat}-${p.lon}-${i}`}
                    onPress={() => f.pickPlace(p)}
                    className="flex-row items-center gap-2 border-b border-line px-3 py-2.5 active:bg-surface-2">
                    <Ionicons name="location-outline" size={16} color={MUTED} />
                    <Text numberOfLines={2} className="flex-1 text-sm text-content-2">{p.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {f.selected ? (
            <View className="flex-1">
              <RestroomSheet restroom={f.selected} title={f.titleFor(f.selected)} onBack={() => f.setSelected(null)} onTitlePress={() => {}} />
            </View>
          ) : (
            <FlatList
              data={f.list}
              keyExtractor={(i, idx) => (i as Restroom).id + idx}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 8 }}
              onEndReachedThreshold={0.6}
              onEndReached={() => f.hasNextPage && !f.isFetchingNextPage && f.fetchNextPage()}
              ListHeaderComponent={
                <View className="pb-1">
                  <View className="flex-row items-center justify-between px-1 pb-2">
                    {f.nearest != null ? (
                      <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Nearest {distLabel(f.nearest)} away</Text>
                    ) : (
                      <Text className="text-sm font-semibold text-content">Restrooms nearby</Text>
                    )}
                    {f.list.length ? <Text className="text-xs text-content-2">{f.list.length}{f.hasNextPage ? '+' : ''}</Text> : null}
                  </View>
                  <View className="mb-1">
                    <AddRestroomCard onPress={f.addHere} />
                  </View>
                </View>
              }
              ListFooterComponent={f.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} /> : null}
              ListEmptyComponent={
                !f.locReady || f.isLoading ? (
                  <View className="mt-10 items-center">
                    <ActivityIndicator color={ACCENT} />
                    <Text className="mt-3 text-sm text-content-2">Finding restrooms near you…</Text>
                  </View>
                ) : (
                  <Text className="mt-10 px-6 text-center text-sm text-content-2">No restrooms nearby yet.</Text>
                )
              }
              renderItem={({ item }) => {
                const it = item as Restroom;
                return (
                  <PlaceCard item={it} title={f.titleFor(it)} active={it.id === f.activeId} saved={f.savedIds?.has(it.id)} onSelect={() => f.select(it)} onResolve={f.resolveTitle} />
                );
              }}
            />
          )}

          <Pressable
            onPress={() => setDrawerOpen(false)}
            className="absolute items-center justify-center bg-surface"
            style={[{ top: '50%', right: -15, width: 16, height: 52, borderTopRightRadius: 8, borderBottomRightRadius: 8 }, styles.shadow]}>
            <Ionicons name="chevron-back" size={16} color="#6B7280" />
          </Pressable>
      </Animated.View>
      {!drawerOpen ? (
        <Pressable
          onPress={() => setDrawerOpen(true)}
          className="absolute items-center justify-center bg-surface"
          style={[{ top: '50%', left: 0, width: 22, height: 56, borderTopRightRadius: 10, borderBottomRightRadius: 10, zIndex: 10 }, styles.shadow]}>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </Pressable>
      ) : null}

      <WebNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <FilterSheet
        visible={f.filterOpen}
        onClose={() => f.setFilterOpen(false)}
        sort={f.sort}
        setSort={f.setSort}
        filters={f.filters}
        toggleFilter={f.toggleFilter}
        clearFilters={() => f.setFilters({})}
        resultLabel={`Show ${f.list.length}${f.hasNextPage ? '+' : ''} results`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
