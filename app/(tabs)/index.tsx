import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useInfiniteQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppMapView, AppMarker, type AppMapHandle, type Region } from '@/components/map';
import { RestroomSheet, type SheetRestroom } from '@/components/restroom-sheet';
import { ACCENT } from '@/lib/auth';
import { bestTitle, isGenericName, reverseGeocode } from '@/lib/geocode';
import { DARK_MAP_STYLE, MAP_PROVIDER, openDirections } from '@/lib/maps';
import { supabase } from '@/lib/supabase';
import { useThemePref } from '@/lib/theme';

type Coords = { lat: number; lng: number };
type Row = SheetRestroom & { address: string | null; avg_rating: number | null; review_count?: number; log_count?: number };
type Place = { lat: string; lon: string; display_name: string };

const ACCESS: Record<string, { label: string; color: string }> = {
  public: { label: 'Public', color: '#16A34A' },
  code: { label: 'Code', color: '#D97706' },
  ask_staff: { label: 'Ask staff', color: '#DC2626' },
  customers_only: { label: 'Customers', color: '#2563EB' },
};

const PAGE = 40;
const DEFAULT_REGION: Region = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 };

const SORTS = [
  { key: 'near', label: 'Nearest', icon: 'navigate' },
  { key: 'rating', label: 'Top rated', icon: 'star' },
  { key: 'popular', label: 'Most logged', icon: 'flame' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

const FILTERS = [
  { key: 'p_public_only', label: 'Public', icon: 'earth' },
  { key: 'p_free', label: 'Free', icon: 'pricetag' },
  { key: 'p_no_code', label: 'No code', icon: 'keypad' },
  { key: 'p_no_purchase', label: 'No purchase', icon: 'card' },
  { key: 'p_accessible', label: 'Accessible', icon: 'accessibility' },
  { key: 'p_changing_table', label: 'Changing table', icon: 'body' },
  { key: 'p_unisex', label: 'Gender-neutral', icon: 'male-female' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

function distLabel(d: number | null) {
  if (d == null) return null;
  return d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`;
}

/* ---- a list card that resolves a real title for generic/unnamed restrooms ---- */
function PlaceCard({
  item,
  title,
  active,
  onSelect,
  onResolve,
}: {
  item: Row;
  title: string;
  active: boolean;
  onSelect: () => void;
  onResolve: (item: Row) => void;
}) {
  useEffect(() => {
    onResolve(item);
  }, [item.id]);

  const a = item.access_type ? ACCESS[item.access_type] : null;
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-70 ${
        active ? 'border-2' : 'border-neutral-200 dark:border-neutral-800'
      }`}
      style={active ? { borderColor: ACCENT } : undefined}>
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT + '22' }}>
        <Ionicons name="location" size={20} color={ACCENT} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {title}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          {item.avg_rating != null ? (
            <Text className="text-xs font-semibold" style={{ color: ACCENT }}>★ {Number(item.avg_rating).toFixed(1)}</Text>
          ) : null}
          {a ? <Text className="text-xs font-medium" style={{ color: a.color }}>{a.label}</Text> : null}
          {item.accessible ? <Ionicons name="accessibility" size={13} color="#6B7280" /> : null}
          {item.unisex ? <Ionicons name="male-female" size={13} color="#6B7280" /> : null}
          {item.changing_table ? <Ionicons name="body" size={13} color="#6B7280" /> : null}
          {item.log_count ? <Text className="text-xs text-neutral-400">· 📍 {item.log_count}</Text> : null}
          {distLabel(item.dist) ? <Text className="text-xs text-neutral-400">· {distLabel(item.dist)}</Text> : null}
        </View>
      </View>
      <Pressable
        hitSlop={8}
        onPress={() => openDirections(item.lat, item.lng, title)}
        className="items-center justify-center rounded-full px-3 py-2"
        style={{ backgroundColor: ACCENT + '18' }}>
        <Ionicons name="navigate" size={18} color={ACCENT} />
      </Pressable>
    </Pressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePref();
  const sheetBg = scheme === 'dark' ? '#0a0a0c' : '#ffffff';
  const mapRef = useRef<AppMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const markerTapRef = useRef(0); // guards map onPress from clearing a marker selection on iOS

  const [me, setMe] = useState<Coords | null>(null);
  const [center, setCenter] = useState<Coords | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [locReady, setLocReady] = useState(false);
  const [locNote, setLocNote] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortKey>('near');
  const [filters, setFilters] = useState<Partial<Record<FilterKey, boolean>>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const toggleFilter = (k: FilterKey) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  // place search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);

  const active = center ?? me;

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
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocReady(true);
          return;
        }
      } catch {}
      try {
        const j = await fetch('https://ipwho.is/').then((r) => r.json());
        if (j?.success && j.latitude) {
          setMe({ lat: j.latitude, lng: j.longitude });
          setLocNote(`Approx location — ${j.city ?? 'your area'}`);
        }
      } catch {}
      setLocReady(true);
    })();
  }, []);

  useEffect(() => {
    if (active && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: active.lat, longitude: active.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
    }
  }, [active?.lat, active?.lng]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'CrappleMaps/1.0 (poc)' },
        });
        setResults((await r.json()) as Place[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const pickPlace = (p: Place) => {
    Keyboard.dismiss();
    setCenter({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) });
    setPlaceLabel(p.display_name.split(',').slice(0, 2).join(',').trim());
    setQuery('');
    setResults([]);
    setSelected(null);
  };

  const backToMe = () => {
    setCenter(null);
    setPlaceLabel(null);
    setQuery('');
    setResults([]);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['finder', active?.lat, active?.lng, sort, JSON.stringify(filters)],
    enabled: locReady,
    initialPageParam: 0,
    getNextPageParam: (last: Row[], all) => (last.length === PAGE ? all.length * PAGE : undefined),
    queryFn: async ({ pageParam }): Promise<Row[]> => {
      if (active) {
        const { data, error } = await supabase.rpc('nearby_restrooms_v2', {
          in_lat: active.lat,
          in_lng: active.lng,
          in_limit: PAGE,
          in_offset: pageParam,
          p_sort: sort,
          ...filters,
        });
        if (error) throw error;
        return (data ?? []).map((r: any) => ({ ...r, dist: r.dist_m != null ? r.dist_m / 1609.34 : null }));
      }
      const { data, error } = await supabase
        .from('restrooms')
        .select('id,name,lat,lng,address,access_type,accessible,unisex,changing_table')
        .range(pageParam, pageParam + PAGE - 1);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r, dist: null }));
    },
  });

  const list = data?.pages.flat() ?? [];
  const activeId: string | undefined = selected?.id;
  const currentSort = SORTS.find((s) => s.key === sort) ?? SORTS[0];

  // Reverse-geocode a real title for generic/unnamed restrooms (throttled + cached).
  const resolveTitle = useCallback((item: Row) => {
    if (!isGenericName(item.name)) return;
    reverseGeocode(item.lat, item.lng).then((p) => {
      if (p?.title) setTitles((t) => (t[item.id] ? t : { ...t, [item.id]: p.title }));
    });
  }, []);

  const titleFor = (item: Row) => bestTitle(item.name, titles[item.id] ? { title: titles[item.id], full: '' } : null);

  const select = (item: Row) => {
    Keyboard.dismiss();
    setResults([]);
    markerTapRef.current = Date.now();
    setSelected(item);
    mapRef.current?.animateToRegion({ latitude: item.lat, longitude: item.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    sheetRef.current?.snapToIndex(0); // open the place card as a peek — map stays dominant (Google Maps)
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <AppMapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        onPress={() => {
          // Any tap on the map closes the search keyboard and drops the search focus.
          Keyboard.dismiss();
          setResults([]);
          // Ignore the map tap that iOS fires immediately after a marker tap.
          if (Date.now() - markerTapRef.current < 500) return;
          setSelected(null);
        }}
        initialRegion={DEFAULT_REGION}>
        {list.map((item) => (
          <AppMarker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            pinColor={item.id === activeId ? '#DC2626' : ACCENT}
            onPress={() => select(item)}
          />
        ))}
      </AppMapView>

      {/* floating search — geocodes an address / city / ZIP and recenters */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }}>
        <View className="flex-row items-center rounded-2xl bg-white px-3 dark:bg-neutral-900" style={styles.shadow}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search address, city, or ZIP…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            returnKeyType="search"
            className="flex-1 px-2 py-3 text-base text-neutral-900 dark:text-neutral-50"
          />
          {searching ? <ActivityIndicator size="small" color="#9CA3AF" /> : null}
          {query.length > 0 && !searching ? (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
          <View className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <Pressable hitSlop={8} onPress={() => setFilterOpen(true)} className="pr-0.5">
            <Ionicons name="menu" size={22} color={activeFilterCount ? ACCENT : '#4B5563'} />
          </Pressable>
        </View>

        {/* active filters as removable pills (Google-Maps style, below the search bar) */}
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
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text numberOfLines={2} className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                  {p.display_name}
                </Text>
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

      {/* floating sort/filter button on the map */}
      <Pressable
        onPress={() => setFilterOpen(true)}
        style={{ position: 'absolute', left: 16, bottom: '47%', ...styles.shadow }}
        className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
        <Ionicons name="options" size={20} color={activeFilterCount ? ACCENT : '#4B5563'} />
      </Pressable>

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
                <Text className="text-xs text-neutral-400" numberOfLines={1}>
                  Sorted by {currentSort.label.toLowerCase()}
                  {activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}` : ''}
                  {placeLabel ? ` · near ${placeLabel}` : ''}
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
              keyExtractor={(i, idx) => (i as Row).id + idx}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 8 }}
              onEndReachedThreshold={0.6}
              onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
              ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} /> : null}
              renderItem={({ item }) => {
                const it = item as Row;
                return (
                  <PlaceCard
                    item={it}
                    title={titleFor(it)}
                    active={it.id === activeId}
                    onSelect={() => select(it)}
                    onResolve={resolveTitle}
                  />
                );
              }}
            />
          </>
        )}
      </BottomSheet>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setFilterOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-white px-5 pt-3 dark:bg-neutral-900"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Sort & filter</Text>
              {activeFilterCount > 0 ? (
                <Pressable onPress={() => setFilters({})} hitSlop={8}>
                  <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Sort by</Text>
            <View className="flex-row gap-2">
              {SORTS.map((s) => {
                const on = sort === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSort(s.key)}
                    className={`flex-1 items-center gap-1 rounded-2xl border py-3 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                    style={on ? { backgroundColor: ACCENT } : undefined}>
                    <Ionicons name={s.icon as any} size={18} color={on ? '#fff' : '#6B7280'} />
                    <Text className={on ? 'text-xs font-semibold text-white' : 'text-xs text-neutral-600 dark:text-neutral-300'}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Filters</Text>
            <View className="flex-row flex-wrap gap-2">
              {FILTERS.map((f) => {
                const on = !!filters[f.key];
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => toggleFilter(f.key)}
                    className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                    style={on ? { backgroundColor: ACCENT } : undefined}>
                    <Ionicons name={f.icon as any} size={15} color={on ? '#fff' : '#6B7280'} />
                    <Text className={on ? 'text-sm font-semibold text-white' : 'text-sm text-neutral-700 dark:text-neutral-300'}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => setFilterOpen(false)} className="mt-6 items-center rounded-2xl py-3.5" style={{ backgroundColor: ACCENT }}>
              <Text className="text-base font-semibold text-white">Show {list.length}{hasNextPage ? '+' : ''} results</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  sheetBg: { backgroundColor: '#fff' },
});
