import { Icon } from '@/components/ui';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRestroomCard, FilterSheet, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { DEFAULT_REGION, VISITED, useFinder } from '@/hooks/useFinder';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel } from '@/lib/restrooms/filters';
import { useColors, useThemePref } from '@/lib/theme';
import { ACCENT, DANGER } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// Shared by native (iOS/Android) AND mobile web so they stay identical. Sort and
// filter live in the sheet (FilterSheet), not the search bar.
const PEEK = 84; // sheet height when collapsed — just the handle + summary header

export function MobileMap() {
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePref();
  const c = useColors();
  const sheetRef = useRef<BottomSheet>(null);
  const f = useFinder();

  const openRestroom = (item: Restroom) => {
    f.select(item);
    sheetRef.current?.snapToIndex(1);
  };
  const expand = () => sheetRef.current?.snapToIndex(1);

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
          const coord = e?.nativeEvent?.coordinate;
          if (coord) f.addRestroomAt({ lat: coord.latitude, lng: coord.longitude });
        }}
        onPress={() => {
          Keyboard.dismiss();
          if (Date.now() - f.markerTapRef.current < 500) return;
          f.setSelected(null);
        }}
        initialRegion={DEFAULT_REGION}>
        {f.list.map((item) => (
          <AppMarker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            pinColor={item.id === f.activeId ? DANGER : f.loggedIds?.has(item.id) ? VISITED : ACCENT}
            onPress={() => openRestroom(item)}
          />
        ))}
      </AppMapView>

      <View style={{ position: 'absolute', top: insets.top + 10, left: 14, right: 14, zIndex: 20 }}>
        <View className="flex-row items-center rounded-2xl bg-surface px-3" style={styles.shadow}>
          <Icon name="search" size={16} color={c.content2} />
          <TextInput
            placeholder="Search address, city, or ZIP…"
            placeholderTextColor={c.content2}
            value={f.query}
            onChangeText={f.setQuery}
            autoCapitalize="words"
            returnKeyType="search"
            className="flex-1 px-2 py-3 text-base text-content"
          />
          {f.searching ? (
            <ActivityIndicator size="small" color={c.content2} />
          ) : f.query.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => f.setQuery('')}>
              <Icon name="close-circle" size={18} color={c.content2} />
            </Pressable>
          ) : null}
        </View>

        {f.results.length > 0 ? (
          <View className="mt-2 overflow-hidden rounded-2xl bg-surface" style={styles.shadow}>
            {f.results.map((p, i) => (
              <Pressable
                key={`${p.lat}-${p.lon}-${i}`}
                onPress={() => f.pickPlace(p)}
                className="flex-row items-center gap-2 border-b border-line px-3 py-3 active:bg-surface-2">
                <Icon name="location-outline" size={16} color={c.content2} />
                <Text numberOfLines={2} className="flex-1 text-sm text-content">{p.display_name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* recenter + zoom to the user (re-prompts location if not granted) */}
      <Pressable
        onPress={f.recenterOnMe}
        className="absolute items-center justify-center rounded-full bg-surface"
        style={[{ right: 16, bottom: PEEK + 18, width: 46, height: 46 }, styles.shadow]}>
        <Icon name="locate" size={22} color={ACCENT} />
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={[PEEK, '55%', '92%']}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.content2 }}>
        {f.selected ? (
          <RestroomSheet
            restroom={f.selected}
            title={f.titleFor(f.selected)}
            onBack={() => {
              f.setSelected(null);
              sheetRef.current?.snapToIndex(1);
            }}
            onTitlePress={() => sheetRef.current?.snapToIndex(2)}
          />
        ) : (
          <>
            {/* summary header — always visible (shows in the collapsed peek); tap to expand */}
            <Pressable onPress={expand} className="flex-row items-center justify-between border-b border-line px-5 pb-2.5">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-content">
                  {f.list.length ? `${f.list.length}${f.hasNextPage ? '+' : ''} nearby` : 'Restrooms'}
                </Text>
                <Text className="text-xs" numberOfLines={1}>
                  {f.nearest != null ? (
                    <Text className="font-semibold" style={{ color: ACCENT }}>Nearest {distLabel(f.nearest)} away</Text>
                  ) : null}
                  {f.nearest != null ? <Text className="text-content-2">{'  ·  '}</Text> : null}
                  <Text className="text-content-2">
                    Sorted by {f.currentSort.label.toLowerCase()}
                    {f.activeFilterCount ? ` · ${f.activeFilterCount} filter${f.activeFilterCount > 1 ? 's' : ''}` : ''}
                    {f.placeLabel ? ` · near ${f.placeLabel}` : ''}
                  </Text>
                </Text>
              </View>
              <Pressable
                onPress={() => f.setFilterOpen(true)}
                className="flex-row items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 active:opacity-70"
                style={f.activeFilterCount ? { borderColor: ACCENT } : undefined}>
                <Icon name="options-outline" size={15} color={f.activeFilterCount ? ACCENT : c.content2} />
                <Text className="text-sm font-medium" style={{ color: f.activeFilterCount ? ACCENT : c.content2 }}>Sort & filter</Text>
              </Pressable>
            </Pressable>

            <BottomSheetFlatList
              data={f.list}
              keyExtractor={(i, idx) => (i as Restroom).id + idx}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              onEndReachedThreshold={0.6}
              onEndReached={() => f.hasNextPage && !f.isFetchingNextPage && f.fetchNextPage()}
              ListHeaderComponent={<AddRestroomCard onPress={f.addHere} />}
              ListFooterComponent={f.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} /> : null}
              ListEmptyComponent={
                !f.locReady || f.isLoading ? (
                  <View className="mt-10 items-center">
                    <ActivityIndicator color={ACCENT} />
                    <Text className="mt-3 text-sm text-content-2">Finding restrooms near you…</Text>
                  </View>
                ) : (
                  <Text className="mt-10 px-8 text-center text-sm text-content-2">No restrooms nearby yet.</Text>
                )
              }
              renderItem={({ item }) => {
                const it = item as Restroom;
                return (
                  <PlaceCard item={it} title={f.titleFor(it)} active={it.id === f.activeId} saved={f.savedIds?.has(it.id)} onSelect={() => openRestroom(it)} onResolve={f.resolveTitle} />
                );
              }}
            />
          </>
        )}
      </BottomSheet>

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
  shadow: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
