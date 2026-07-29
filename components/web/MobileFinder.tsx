import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetFlatList, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddRestroomCard, FilterControls, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { DEFAULT_REGION, VISITED, useFinder } from '@/hooks/useFinder';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel } from '@/lib/restrooms/filters';
import { useThemePref } from '@/lib/theme';
import { ACCENT, MUTED } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// Native-style map layout for phone-sized web: full-bleed map, a floating search
// bar, and a real @gorhom bottom sheet — swipe the handle down to collapse, up to
// expand. App nav is the OS bottom tab bar. Mirrors native index.tsx.
export function MobileFinder() {
  const { scheme } = useThemePref();
  const sheetBg = scheme === 'dark' ? '#0a0a0c' : '#ffffff';
  const sheetRef = useRef<BottomSheet>(null);
  const f = useFinder();
  const [showFilters, setShowFilters] = useState(false);

  const openRestroom = (item: Restroom) => {
    setShowFilters(false);
    f.select(item);
    sheetRef.current?.snapToIndex(1);
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
            pinColor={item.id === f.activeId ? '#DC2626' : f.loggedIds?.has(item.id) ? VISITED : ACCENT}
            onPress={() => openRestroom(item)}
          />
        ))}
      </AppMapView>

      {/* floating search */}
      <View style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20 }}>
        <View className="flex-row items-center rounded-full bg-surface px-3" style={styles.shadow}>
          <Ionicons name="search" size={16} color={MUTED} />
          <TextInput
            placeholder="Search address, city, or ZIP…"
            placeholderTextColor={MUTED}
            value={f.query}
            onChangeText={f.setQuery}
            autoCapitalize="words"
            className="flex-1 px-2 py-3 text-base text-content"
          />
          {f.searching ? (
            <ActivityIndicator size="small" color={MUTED} />
          ) : f.query.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => f.setQuery('')}>
              <Ionicons name="close-circle" size={18} color={MUTED} />
            </Pressable>
          ) : null}
          <View className="mx-1.5 h-5 w-px bg-line" />
          <Pressable
            hitSlop={8}
            onPress={() => {
              setShowFilters((v) => !v);
              sheetRef.current?.snapToIndex(1);
            }}
            className="pr-0.5">
            <Ionicons name="options" size={22} color={showFilters || f.activeFilterCount ? ACCENT : '#6B7280'} />
          </Pressable>
        </View>

        {f.results.length > 0 ? (
          <View className="mt-2 overflow-hidden rounded-2xl bg-surface" style={styles.shadow}>
            {f.results.map((p, i) => (
              <Pressable
                key={`${p.lat}-${p.lon}-${i}`}
                onPress={() => f.pickPlace(p)}
                className="flex-row items-center gap-2 border-b border-line px-3 py-3 active:bg-surface-2">
                <Ionicons name="location-outline" size={16} color={MUTED} />
                <Text numberOfLines={2} className="flex-1 text-sm text-content-2">{p.display_name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={['13%', '60%', '92%']}
        backgroundStyle={{ backgroundColor: sheetBg }}
        handleIndicatorStyle={{ backgroundColor: '#9CA3AF' }}>
        {showFilters ? (
          <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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
          </BottomSheetScrollView>
        ) : f.selected ? (
          <RestroomSheet restroom={f.selected} title={f.titleFor(f.selected)} onBack={() => f.setSelected(null)} onTitlePress={() => sheetRef.current?.snapToIndex(2)} />
        ) : (
          <BottomSheetFlatList
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
                <PlaceCard item={it} title={f.titleFor(it)} active={it.id === f.activeId} saved={f.savedIds?.has(it.id)} onSelect={() => openRestroom(it)} onResolve={f.resolveTitle} />
              );
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
});
