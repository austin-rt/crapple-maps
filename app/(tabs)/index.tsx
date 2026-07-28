import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheet, PlaceCard } from '@/components/finder';
import { AppMapView, AppMarker, type AppMapHandle, type Region } from '@/components/map';
import { RestroomSheet } from '@/components/restroom';
import { useLoggedRestroomIds } from '@/hooks/useLogs';
import { useNearbyRestrooms } from '@/hooks/useNearbyRestrooms';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { useSavedIds } from '@/hooks/useSaved';
import { useAuth } from '@/lib/auth';
import { bestTitle, isGenericName, reverseGeocode } from '@/lib/geocode';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { distLabel, FILTERS, SORTS, type FilterKey, type SortKey } from '@/lib/restrooms/filters';
import { useThemePref } from '@/lib/theme';
import { ACCENT, MUTED } from '@/lib/tokens';
import type { Restroom } from '@/lib/types';

type Coords = { lat: number; lng: number };

const DEFAULT_REGION: Region = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const VISITED = '#7C3AED'; // purple marker for restrooms you've logged a visit at

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { scheme } = useThemePref();
  const sheetBg = scheme === 'dark' ? '#0a0a0c' : '#ffffff';
  const mapRef = useRef<AppMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const markerTapRef = useRef(0);

  const [me, setMe] = useState<Coords | null>(null);
  const [center, setCenter] = useState<Coords | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [locReady, setLocReady] = useState(false);
  const [locNote, setLocNote] = useState('');
  const [selected, setSelected] = useState<Restroom | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortKey>('near');
  const [filters, setFilters] = useState<Partial<Record<FilterKey, boolean>>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const toggleFilter = (k: FilterKey) => setFilters((f) => ({ ...f, [k]: !f[k] }));
  const active = center ?? me;

  const { results, searching } = usePlaceSearch(query);
  const { data: savedIds } = useSavedIds(session?.user.id);
  const { data: loggedIds } = useLoggedRestroomIds(session?.user.id);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNearbyRestrooms({ active, sort, filters, enabled: locReady });

  // Deep-link from a post's "See on map" — recenter here.
  const params = useLocalSearchParams<{ flat?: string; flng?: string }>();
  useEffect(() => {
    const lat = parseFloat(params.flat ?? '');
    const lng = parseFloat(params.flng ?? '');
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setCenter({ lat, lng });
      setPlaceLabel('Pinned from a post');
    }
  }, [params.flat, params.flng]);

  useEffect(() => {
    let preciseSet = false;
    // Fast path: IP geolocation lands us close-ish and lets the list populate
    // right away, instead of blocking on slow high-accuracy GPS.
    (async () => {
      try {
        const j = await fetch('https://ipwho.is/').then((r) => r.json());
        if (j?.success && j.latitude && !preciseSet) {
          setMe({ lat: j.latitude, lng: j.longitude });
          setLocNote(`Approx location — ${j.city ?? 'your area'}`);
        }
      } catch {}
      setLocReady(true);
    })();
    // Precise path (in parallel): refine to real GPS when allowed. Last-known is
    // instant if cached; Balanced accuracy returns far faster than high-accuracy.
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const last = await Location.getLastKnownPositionAsync();
        if (last && !preciseSet) setMe({ lat: last.coords.latitude, lng: last.coords.longitude });
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        preciseSet = true;
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocNote('');
        setLocReady(true);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (active && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: active.lat, longitude: active.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
    }
  }, [active?.lat, active?.lng]);

  const pickPlace = (p: { lat: string; lon: string; display_name: string }) => {
    Keyboard.dismiss();
    setCenter({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) });
    setPlaceLabel(p.display_name.split(',').slice(0, 2).join(',').trim());
    setQuery('');
    setSelected(null);
  };

  const backToMe = () => {
    setCenter(null);
    setPlaceLabel(null);
    setQuery('');
  };

  const list = (data?.pages.flat() ?? []) as Restroom[];
  const activeId = selected?.id;
  const currentSort = SORTS.find((s) => s.key === sort) ?? SORTS[0];
  const nearest = list.reduce<number | null>((m, r) => (r.dist != null && (m == null || r.dist < m) ? r.dist : m), null);

  const resolveTitle = useCallback((item: Restroom) => {
    if (!isGenericName(item.name)) return;
    reverseGeocode(item.lat, item.lng).then((p) => {
      if (p?.title) setTitles((t) => (t[item.id] ? t : { ...t, [item.id]: p.title }));
    });
  }, []);

  const titleFor = (item: Restroom) => bestTitle(item.name, titles[item.id] ? { title: titles[item.id], full: '' } : null);

  const select = (item: Restroom) => {
    Keyboard.dismiss();
    markerTapRef.current = Date.now();
    setSelected(item);
    mapRef.current?.animateToRegion({ latitude: item.lat, longitude: item.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    sheetRef.current?.snapToIndex(0);
  };

  // Add-a-restroom: open the form seeded with a coordinate (long-press = pressed
  // point, results-sheet row = current location / map center). Anyone can open and
  // fill it; sign-in is only required at submit (form is persisted across it).
  const addRestroomAt = (coord: Coords) => {
    router.push({ pathname: '/restroom/new', params: { lat: String(coord.lat), lng: String(coord.lng) } });
  };
  const addHere = () => addRestroomAt(active ?? { lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude });

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <AppMapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        onLongPress={(e: any) => {
          const c = e?.nativeEvent?.coordinate;
          if (c) addRestroomAt({ lat: c.latitude, lng: c.longitude });
        }}
        onPress={() => {
          Keyboard.dismiss();
          if (Date.now() - markerTapRef.current < 500) return;
          setSelected(null);
        }}
        initialRegion={DEFAULT_REGION}>
        {list.map((item) => (
          <AppMarker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            pinColor={item.id === activeId ? '#DC2626' : loggedIds?.has(item.id) ? VISITED : ACCENT}
            onPress={() => select(item)}
          />
        ))}
      </AppMapView>

      {/* floating search — geocodes an address / city / ZIP and recenters */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }}>
        <View className="flex-row items-center rounded-2xl bg-white px-3 dark:bg-neutral-900" style={styles.shadow}>
          <Ionicons name="search" size={16} color={MUTED} />
          <TextInput
            placeholder="Search address, city, or ZIP…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            returnKeyType="search"
            className="flex-1 px-2 py-3 text-base text-neutral-900 dark:text-neutral-50"
          />
          {searching ? <ActivityIndicator size="small" color={MUTED} /> : null}
          {query.length > 0 && !searching ? (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={MUTED} />
            </Pressable>
          ) : null}
          <View className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <Pressable hitSlop={8} onPress={() => setFilterOpen(true)} className="pr-0.5">
            <Ionicons name="options" size={22} color={activeFilterCount ? ACCENT : '#4B5563'} />
          </Pressable>
        </View>

        {activeFilterCount > 0 && results.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 8, paddingRight: 8 }}
            className="mt-1">
            {FILTERS.filter((f) => filters[f.key]).map((f) => (
              <Pressable
                key={f.key}
                onPress={() => toggleFilter(f.key)}
                className="flex-row items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2"
                style={[{ backgroundColor: ACCENT }, styles.shadow]}>
                <Ionicons name={f.icon as any} size={13} color="#fff" />
                <Text className="text-xs font-semibold text-white">{f.label}</Text>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {results.length > 0 ? (
          <View className="mt-2 overflow-hidden rounded-2xl bg-white dark:bg-neutral-900" style={styles.shadow}>
            {results.map((p, i) => (
              <Pressable
                key={`${p.lat}-${p.lon}-${i}`}
                onPress={() => pickPlace(p)}
                className="flex-row items-center gap-2 border-b border-neutral-100 px-3 py-3 active:bg-neutral-100 dark:border-neutral-800 dark:active:bg-neutral-800">
                <Ionicons name="location-outline" size={16} color={MUTED} />
                <Text numberOfLines={2} className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">{p.display_name}</Text>
              </Pressable>
            ))}
          </View>
        ) : placeLabel || locNote ? (
          <View className="mt-2 flex-row items-center gap-1 self-start rounded-full bg-white/95 px-3 py-1 dark:bg-neutral-900/95" style={styles.shadow}>
            <Ionicons name={placeLabel ? 'location' : 'navigate'} size={12} color={ACCENT} />
            <Text className="text-xs text-neutral-600 dark:text-neutral-300">{placeLabel || locNote}</Text>
          </View>
        ) : null}
      </View>

      {center ? (
        <Pressable
          onPress={backToMe}
          style={{ position: 'absolute', right: 16, bottom: '47%', ...styles.shadow }}
          className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
          <Ionicons name="locate" size={20} color={ACCENT} />
        </Pressable>
      ) : null}

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={['30%', '58%', '92%']}
        backgroundStyle={{ backgroundColor: sheetBg }}
        handleIndicatorStyle={{ backgroundColor: '#9CA3AF' }}>
        {selected ? (
          <RestroomSheet
            restroom={selected}
            title={titleFor(selected)}
            onBack={() => {
              setSelected(null);
              sheetRef.current?.snapToIndex(1);
            }}
            onTitlePress={() => sheetRef.current?.snapToIndex(0)}
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 pb-2 dark:border-neutral-800">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  {list.length ? `${list.length}${hasNextPage ? '+' : ''} nearby` : 'Restrooms'}
                </Text>
                <Text className="text-xs" numberOfLines={1}>
                  {nearest != null ? (
                    <Text className="font-semibold" style={{ color: ACCENT }}>Nearest {distLabel(nearest)} away</Text>
                  ) : null}
                  {nearest != null ? <Text className="text-neutral-400">{'  ·  '}</Text> : null}
                  <Text className="text-neutral-400">
                    Sorted by {currentSort.label.toLowerCase()}
                    {activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}` : ''}
                    {placeLabel ? ` · near ${placeLabel}` : ''}
                  </Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setFilterOpen(true)}
                className="flex-row items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 active:opacity-70 dark:border-neutral-700"
                style={activeFilterCount ? { borderColor: ACCENT } : undefined}>
                <Ionicons name="options-outline" size={15} color={activeFilterCount ? ACCENT : '#6B7280'} />
                <Text className="text-sm font-medium" style={{ color: activeFilterCount ? ACCENT : '#6B7280' }}>Sort & filter</Text>
              </Pressable>
            </View>
            <BottomSheetFlatList
              data={list}
              keyExtractor={(i, idx) => (i as Restroom).id + idx}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 8 }}
              onEndReachedThreshold={0.6}
              onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
              ListHeaderComponent={
                <Pressable
                  onPress={addHere}
                  className="mb-2 flex-row items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-3 active:opacity-70 dark:border-neutral-700">
                  <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT + '18' }}>
                    <Ionicons name="add" size={22} color={ACCENT} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: ACCENT }}>Add a restroom</Text>
                    <Text className="text-xs text-neutral-400">Don’t see it? Long-press the map or tap here.</Text>
                  </View>
                </Pressable>
              }
              ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} /> : null}
              ListEmptyComponent={
                !locReady || isLoading ? (
                  <View className="mt-10 items-center">
                    <ActivityIndicator color={ACCENT} />
                    <Text className="mt-3 text-sm text-neutral-400">Finding restrooms near you…</Text>
                  </View>
                ) : (
                  <Text className="mt-10 px-8 text-center text-sm text-neutral-400">No restrooms nearby yet. Long-press the map to add one.</Text>
                )
              }
              renderItem={({ item }) => {
                const it = item as Restroom;
                return (
                  <PlaceCard
                    item={it}
                    title={titleFor(it)}
                    active={it.id === activeId}
                    saved={savedIds?.has(it.id)}
                    onSelect={() => select(it)}
                    onResolve={resolveTitle}
                  />
                );
              }}
            />
          </>
        )}
      </BottomSheet>

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        sort={sort}
        setSort={setSort}
        filters={filters}
        toggleFilter={toggleFilter}
        clearFilters={() => setFilters({})}
        resultLabel={`Show ${list.length}${hasNextPage ? '+' : ''} results`}
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
