import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddRestroomCard, FilterControls, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { Avatar } from '@/components/ui';
import { MobileMap } from '@/components/finder/MobileMap';
import { LeftDrawer } from '@/components/web/LeftDrawer';
import { WebNavDrawer } from '@/components/web/WebNavDrawer';
import { DEFAULT_REGION, VISITED, useFinder } from '@/hooks/useFinder';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { useProfile } from '@/hooks/useProfile';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel } from '@/lib/restrooms/filters';
import { useColors, useThemePref } from '@/lib/theme';
import { ACCENT, DANGER } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

const DRAWER_W = 408;

// Web map page. On a phone-sized viewport it serves the native-style mobile
// layout (floating search + bottom sheet + OS tab bar); on desktop it's the
// Google-Maps-style layout below (left results drawer + hamburger nav).
export default function MapWeb() {
  const isMobileWeb = useIsMobileWeb();
  if (isMobileWeb) return <MobileMap />;
  return <DesktopMapWeb />;
}

function DesktopMapWeb() {
  const { scheme } = useThemePref();
  const c = useColors();
  const f = useFinder();
  const { data: me } = useProfile(f.session?.user.id ?? '');
  const [navOpen, setNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const filterActive = showFilters || f.activeFilterCount > 0;

  // Only one left drawer at a time: opening the app nav slides the results
  // drawer away, and closing the nav brings it back.
  const openNav = () => {
    setDrawerOpen(false);
    setNavOpen(true);
  };
  const closeNav = () => {
    setNavOpen(false);
    setDrawerOpen(true);
  };

  // Tapping a map marker selects it and reopens the drawer (if collapsed) so its
  // detail shows; also drop out of the filter panel.
  const selectFromMarker = (item: Restroom) => {
    setShowFilters(false);
    setDrawerOpen(true);
    f.select(item);
  };

  return (
    <View className="flex-1 bg-surface">
      <AppMapView
        ref={f.mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        onRegionChangeComplete={f.onRegionChangeComplete}
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
            pinColor={item.id === f.activeId ? DANGER : f.loggedIds?.has(item.id) ? VISITED : ACCENT}
            onPress={() => selectFromMarker(item)}
          />
        ))}
      </AppMapView>

      {/* top-right: account only, pinned right */}
      <View style={{ position: 'absolute', top: 14, right: 16, zIndex: 20 }}>
        <Pressable onPress={() => router.push('/profile')} className="items-center justify-center overflow-hidden rounded-full bg-surface" style={[{ width: 44, height: 44 }, styles.shadow]}>
          {f.session ? <Avatar seed={me?.avatar_seed || me?.username || f.session.user.id} size={40} /> : <Ionicons name="person-circle-outline" size={30} color={c.content2} />}
        </Pressable>
      </View>

      {/* left results drawer — shared LeftDrawer gives it the slide + opaque bg */}
      <LeftDrawer open={drawerOpen} width={DRAWER_W} zIndex={10}>
        <View style={{ padding: 12, paddingTop: 14 }}>
          <View className="flex-row items-center rounded-full bg-surface-2 pl-1 pr-1">
            <Pressable onPress={openNav} className="items-center justify-center" style={{ width: 42, height: 42 }}>
              <Ionicons name="menu" size={22} color={c.content2} />
            </Pressable>
            <TextInput
              placeholder="Search address, city, or ZIP…"
              placeholderTextColor={c.content2}
              value={f.query}
              onChangeText={f.setQuery}
              autoCapitalize="words"
              className="flex-1 px-1 py-2.5 text-base text-content"
            />
            {f.searching ? (
              <ActivityIndicator size="small" color={c.content2} style={{ marginRight: 4 }} />
            ) : f.query.length > 0 ? (
              <Pressable onPress={() => f.setQuery('')} className="px-1">
                <Ionicons name="close-circle" size={18} color={c.content2} />
              </Pressable>
            ) : null}
            <View className="mx-0.5 h-5 w-px bg-line" />
            <Pressable onPress={() => setShowFilters((v) => !v)} className="items-center justify-center" style={{ width: 40, height: 40 }}>
              <Ionicons name="options" size={20} color={filterActive ? ACCENT : c.content2} />
            </Pressable>
          </View>

          {/* geocode autocomplete results */}
          {f.results.length > 0 ? (
            <View className="mt-1.5 overflow-hidden rounded-xl bg-surface" style={styles.shadow}>
              {f.results.map((p, i) => (
                <Pressable
                  key={`${p.lat}-${p.lon}-${i}`}
                  onPress={() => f.pickPlace(p)}
                  className="flex-row items-center gap-2 border-b border-line px-3 py-2.5 active:bg-surface-2">
                  <Ionicons name="location-outline" size={16} color={c.content2} />
                  <Text numberOfLines={2} className="flex-1 text-sm text-content-2">{p.display_name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {showFilters ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-content">Sort & filter</Text>
              {f.activeFilterCount > 0 ? (
                <Pressable onPress={() => f.setFilters({})} hitSlop={8}>
                  <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>
            <FilterControls sort={f.sort} setSort={f.setSort} filters={f.filters} toggleFilter={f.toggleFilter} />
            <Pressable onPress={() => setShowFilters(false)} className="mt-6 items-center rounded-2xl py-3" style={{ backgroundColor: ACCENT }}>
              <Text className="text-base font-semibold text-white">Show {f.list.length}{f.hasNextPage ? '+' : ''} results</Text>
            </Pressable>
          </ScrollView>
        ) : f.selected ? (
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

      </LeftDrawer>

      {/* one collapse/expand handle: sits at the drawer's right edge when open,
          at the screen edge when collapsed. Chevron points the way it will move. */}
      <Pressable
        onPress={() => setDrawerOpen((v) => !v)}
        className="absolute items-center justify-center rounded-r-xl border border-l-0 border-line bg-surface active:bg-surface-2"
        style={[{ top: '50%', marginTop: -34, left: drawerOpen ? DRAWER_W : 0, width: 26, height: 68, zIndex: 12 }, styles.shadow]}>
        <Ionicons name={drawerOpen ? 'chevron-back' : 'chevron-forward'} size={20} color={c.content2} />
      </Pressable>

      <WebNavDrawer open={navOpen} onClose={closeNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
