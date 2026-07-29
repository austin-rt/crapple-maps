import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { type AppMapHandle, type Region } from '@/components/map';
import { useLoggedRestroomIds } from '@/hooks/useLogs';
import { useNearbyRestrooms } from '@/hooks/useNearbyRestrooms';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { useSavedIds } from '@/hooks/useSaved';
import { useAuth } from '@/lib/auth';
import { bestTitle, isGenericName, reverseGeocode } from '@/lib/geocode';
import { SORTS, type FilterKey, type SortKey } from '@/lib/restrooms/filters';
import type { Restroom } from '@/lib/types';

export type Coords = { lat: number; lng: number };
export const DEFAULT_REGION: Region = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 };
export { VISITED } from '@/lib/tokens'; // purple marker for restrooms you've logged a visit at

// All finder state + logic, shared by the native (bottom-sheet) and web
// (left-drawer) layouts so the two never drift.
export function useFinder() {
  const { session } = useAuth();
  const mapRef = useRef<AppMapHandle>(null);
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

  // The map viewport center (updated as the user pans/zooms). Restrooms are
  // fetched around wherever the map is looking, not only the user's location, so
  // moving the map loads that area. Rounded to ~110m so tiny drags don't refetch.
  const [region, setRegion] = useState<Coords | null>(null);
  const onRegionChangeComplete = useCallback((r: any) => {
    const lat = r?.latitude ?? r?.lat;
    const lng = r?.longitude ?? r?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') setRegion({ lat, lng });
  }, []);
  const base = region ?? active;
  const queryCenter = base ? { lat: Math.round(base.lat * 1000) / 1000, lng: Math.round(base.lng * 1000) / 1000 } : null;

  const { results, searching } = usePlaceSearch(query);
  const { data: savedIds } = useSavedIds(session?.user.id);
  const { data: loggedIds } = useLoggedRestroomIds(session?.user.id);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNearbyRestrooms({ active: queryCenter, sort, filters, enabled: locReady });

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
    // Precise path (in parallel): refine to real GPS when allowed.
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
  };

  const addRestroomAt = (coord: Coords) => {
    router.push({ pathname: '/restroom/new', params: { lat: String(coord.lat), lng: String(coord.lng) } });
  };
  const addHere = () => addRestroomAt(active ?? { lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude });

  const pickPlace = (p: { lat: string; lon: string; display_name: string }) => {
    Keyboard.dismiss();
    setRegion(null); // let the searched center drive the query until the map settles
    setCenter({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) });
    setPlaceLabel(p.display_name.split(',').slice(0, 2).join(',').trim());
    setQuery('');
    setSelected(null);
  };

  const backToMe = () => {
    setRegion(null);
    setCenter(null);
    setPlaceLabel(null);
    setQuery('');
  };

  return {
    session, mapRef, markerTapRef,
    me, center, active, placeLabel, locReady, locNote,
    selected, setSelected,
    sort, setSort, filters, setFilters, toggleFilter, activeFilterCount, filterOpen, setFilterOpen,
    query, setQuery, results, searching,
    savedIds, loggedIds,
    list, activeId, currentSort, nearest,
    hasNextPage, isFetchingNextPage, isLoading, fetchNextPage,
    resolveTitle, titleFor, select, addRestroomAt, addHere, pickPlace, backToMe,
    onRegionChangeComplete,
  };
}
