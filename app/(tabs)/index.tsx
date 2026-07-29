import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRestroomCard, FilterSheet, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { DEFAULT_REGION, VISITED, useFinder } from '@/hooks/useFinder';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel, FILTERS } from '@/lib/restrooms/filters';
import { useColors, useThemePref } from '@/lib/theme';
import { ACCENT, DANGER, ON_ACCENT } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

// Native map screen — full-bleed map + a @gorhom bottom sheet for results. All
// finder state/logic lives in useFinder(), shared with the web left-drawer
// layout (index.web.tsx); only the bottom-sheet presentation is native-specific.
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePref();
  const c = useColors();
  const sheetBg = c.surface;
  const sheetRef = useRef<BottomSheet>(null);
  const f = useFinder();

  // select() in the hook handles state + map pan; the sheet snap is native UI.
  const openRestroom = (item: Restroom) => {
    f.select(item);
    sheetRef.current?.snapToIndex(0);
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

      {/* floating search — geocodes an address / city / ZIP and recenters */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }}>
        <View className="flex-row items-center rounded-2xl bg-white px-3 dark:bg-neutral-900" style={styles.shadow}>
          <Ionicons name="search" size={16} color={c.content2} />
          <TextInput
            placeholder="Search address, city, or ZIP…"
            placeholderTextColor={c.content2}
            value={f.query}
            onChangeText={f.setQuery}
            autoCapitalize="words"
            returnKeyType="search"
            className="flex-1 px-2 py-3 text-base text-content"
          />
          {f.searching ? <ActivityIndicator size="small" color={c.content2} /> : null}
          {f.query.length > 0 && !f.searching ? (
            <Pressable hitSlop={8} onPress={() => f.setQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.content2} />
            </Pressable>
          ) : null}
          <View className="mx-1.5 h-5 w-px bg-surface-3" />
          <Pressable hitSlop={8} onPress={() => f.setFilterOpen(true)} className="pr-0.5">
            <Ionicons name="options" size={22} color={f.activeFilterCount ? ACCENT : c.content2} />
          </Pressable>
        </View>

        {f.activeFilterCount > 0 && f.results.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 8, paddingRight: 8 }}
            className="mt-1">
            {FILTERS.filter((flt) => f.filters[flt.key]).map((flt) => (
              <Pressable
                key={flt.key}
                onPress={() => f.toggleFilter(flt.key)}
                className="flex-row items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2"
                style={[{ backgroundColor: ACCENT }, styles.shadow]}>
                <Ionicons name={flt.icon as any} size={13} color={ON_ACCENT} />
                <Text className="text-xs font-semibold text-white">{flt.label}</Text>
                <Ionicons name="close" size={14} color={ON_ACCENT} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {f.results.length > 0 ? (
          <View className="mt-2 overflow-hidden rounded-2xl bg-surface" style={styles.shadow}>
            {f.results.map((p, i) => (
              <Pressable
                key={`${p.lat}-${p.lon}-${i}`}
                onPress={() => f.pickPlace(p)}
                className="flex-row items-center gap-2 border-b border-neutral-100 px-3 py-3 active:bg-neutral-100 dark:border-neutral-800 active:bg-surface-2">
                <Ionicons name="location-outline" size={16} color={c.content2} />
                <Text numberOfLines={2} className="flex-1 text-sm text-content">{p.display_name}</Text>
              </Pressable>
            ))}
          </View>
        ) : f.placeLabel || f.locNote ? (
          <View className="mt-2 flex-row items-center gap-1 self-start rounded-full bg-white/95 px-3 py-1 dark:bg-neutral-900/95" style={styles.shadow}>
            <Ionicons name={f.placeLabel ? 'location' : 'navigate'} size={12} color={ACCENT} />
            <Text className="text-xs text-content-2">{f.placeLabel || f.locNote}</Text>
          </View>
        ) : null}
      </View>

      {f.center ? (
        <Pressable
          onPress={f.backToMe}
          style={{ position: 'absolute', right: 16, bottom: '47%', ...styles.shadow }}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface">
          <Ionicons name="locate" size={20} color={ACCENT} />
        </Pressable>
      ) : null}

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={['13%', '58%', '92%']}
        backgroundStyle={{ backgroundColor: sheetBg }}
        handleIndicatorStyle={{ backgroundColor: c.content2 }}>
        {f.selected ? (
          <RestroomSheet
            restroom={f.selected}
            title={f.titleFor(f.selected)}
            onBack={() => {
              f.setSelected(null);
              sheetRef.current?.snapToIndex(1);
            }}
            onTitlePress={() => sheetRef.current?.snapToIndex(0)}
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 pb-2 dark:border-neutral-800">
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
                className="flex-row items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 active:opacity-70 dark:border-neutral-700"
                style={f.activeFilterCount ? { borderColor: ACCENT } : undefined}>
                <Ionicons name="options-outline" size={15} color={f.activeFilterCount ? ACCENT : c.content2} />
                <Text className="text-sm font-medium" style={{ color: f.activeFilterCount ? ACCENT : c.content2 }}>Sort & filter</Text>
              </Pressable>
            </View>
            <BottomSheetFlatList
              data={f.list}
              keyExtractor={(i, idx) => (i as Restroom).id + idx}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 8 }}
              onEndReachedThreshold={0.6}
              onEndReached={() => f.hasNextPage && !f.isFetchingNextPage && f.fetchNextPage()}
              ListHeaderComponent={
                <View className="mb-2">
                  <AddRestroomCard onPress={f.addHere} />
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
                  <Text className="mt-10 px-8 text-center text-sm text-content-2">No restrooms nearby yet.</Text>
                )
              }
              renderItem={({ item }) => {
                const it = item as Restroom;
                return (
                  <PlaceCard
                    item={it}
                    title={f.titleFor(it)}
                    active={it.id === f.activeId}
                    saved={f.savedIds?.has(it.id)}
                    onSelect={() => openRestroom(it)}
                    onResolve={f.resolveTitle}
                  />
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
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
