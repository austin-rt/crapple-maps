import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MapPinPicker } from '@/components/map-pin-picker';
import { Stars } from '@/components/stars';
import { ACCENT, useAuth } from '@/lib/auth';
import { pickLogPhotos, uploadLogPhotos } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

type Coords = { latitude: number; longitude: number };
type Place = { lat: string; lon: string; display_name: string };

// Bristol scale 1–7 mapped to emoji + a one-word descriptor (nobody knows "Bristol type").
const BRISTOL = [
  { n: 1, emoji: '🥜', label: 'Pebbles' },
  { n: 2, emoji: '🍇', label: 'Lumpy' },
  { n: 3, emoji: '🌽', label: 'Cracked' },
  { n: 4, emoji: '🍌', label: 'Smooth' },
  { n: 5, emoji: '🐛', label: 'Soft' },
  { n: 6, emoji: '🍦', label: 'Mushy' },
  { n: 7, emoji: '🌊', label: 'Liquid' },
];

function Label({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      {children}
    </Text>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <View className="border-b border-neutral-100 py-5 dark:border-neutral-900">{children}</View>;
}

const inputCls =
  'rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50';

/* ------------------------------ location picker ------------------------------ */

function LocationPicker({
  coords,
  label,
  onPick,
}: {
  coords: Coords | null;
  label: string | null;
  onPick: (c: Coords, label: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`,
          { headers: { 'User-Agent': 'CrappleMaps/1.0 (poc)' } },
        );
        setResults((await r.json()) as Place[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const pick = (p: Place) => {
    onPick({ latitude: parseFloat(p.lat), longitude: parseFloat(p.lon) }, p.display_name);
    setQuery('');
    setResults([]);
  };

  const useCurrent = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location off', 'Search an address instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      // Never surface raw lat/long — reverse-geocode to a human address.
      let lbl = 'Current location';
      try {
        const rev = await Location.reverseGeocodeAsync(c);
        const a = rev[0];
        const addr = [a?.name, a?.street, a?.city, a?.region].filter(Boolean).join(', ');
        if (addr) lbl = addr;
      } catch {}
      onPick(c, lbl);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View>
      {coords ? (
        <View className="mb-3 flex-row items-start gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
          <Ionicons name="location" size={18} color={ACCENT} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">{label}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center rounded-xl border border-neutral-300 px-3 dark:border-neutral-700">
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          placeholder="Search an address or place…"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          className="flex-1 px-2 py-3 text-base text-neutral-900 dark:text-neutral-50"
        />
        {searching ? <ActivityIndicator size="small" color="#9CA3AF" /> : null}
      </View>

      {results.length > 0 ? (
        <View className="mt-2 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          {results.map((p, i) => (
            <Pressable
              key={`${p.lat}-${p.lon}-${i}`}
              onPress={() => pick(p)}
              className="border-b border-neutral-100 px-3 py-3 active:bg-neutral-100 dark:border-neutral-900 dark:active:bg-neutral-900">
              <Text numberOfLines={2} className="text-sm text-neutral-800 dark:text-neutral-200">
                {p.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={useCurrent}
        disabled={locating}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 py-3 active:opacity-70 dark:border-neutral-700">
        <Ionicons name="navigate" size={16} color={ACCENT} />
        <Text className="font-semibold text-neutral-800 dark:text-neutral-100">
          {locating ? 'Locating…' : 'Use my current location'}
        </Text>
      </Pressable>

      {/* Once a rough point is chosen, let them nudge the exact spot (Uber-style). */}
      {coords ? <MapPinPicker coords={coords} onChange={(c) => onPick(c, label ?? 'Pinned location')} /> : null}
    </View>
  );
}

/* --------------------------------- screen --------------------------------- */

export default function ComposeScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [bristol, setBristol] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'friends' | 'private'>('friends');
  const [busy, setBusy] = useState(false);

  // Clear the form whenever the user navigates away from the Log tab.
  useFocusEffect(
    useCallback(
      () => () => {
        setCoords(null);
        setLocLabel(null);
        setRating(null);
        setBristol(null);
        setCaption('');
        setPhotoUris([]);
        setVisibility('friends');
      },
      [],
    ),
  );

  const addPhotos = async () => {
    const uris = await pickLogPhotos(4 - photoUris.length);
    if (uris.length) setPhotoUris((p) => [...p, ...uris].slice(0, 4));
  };

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-neutral-950">
        <Ionicons name="lock-closed-outline" size={40} color="#9CA3AF" />
        <Text className="mt-3 text-center text-lg text-neutral-600 dark:text-neutral-300">
          Sign in on the Profile tab to log a visit.
        </Text>
      </View>
    );
  }

  const submit = async () => {
    if (!coords) return Alert.alert('Pick a location', 'Search an address or use your current location.');
    setBusy(true);
    // Auto-link to the nearest known restroom if you're right at one (≤60m).
    let restroomId: string | null = null;
    try {
      const { data: near } = await supabase.rpc('nearby_restrooms', {
        in_lat: coords.latitude,
        in_lng: coords.longitude,
        in_limit: 1,
        in_offset: 0,
      });
      if (near?.[0]?.dist_m != null && near[0].dist_m <= 60) restroomId = near[0].id;
    } catch {}
    const { data: inserted, error } = await supabase
      .from('logs')
      .insert({
        user_id: session.user.id,
        lat: coords.latitude,
        lng: coords.longitude,
        restroom_id: restroomId,
        rating,
        bristol_type: bristol,
        caption: caption.trim() || null,
        visibility,
      })
      .select('id')
      .single();
    if (error) {
      setBusy(false);
      return Alert.alert('Error', error.message);
    }
    try {
      if (photoUris.length && inserted) await uploadLogPhotos(inserted.id, session.user.id, photoUris);
    } catch (e: any) {
      // Log saved; photo upload is best-effort.
      Alert.alert('Photo upload failed', e?.message ?? 'The log was still saved.');
    }
    setBusy(false);
    setCoords(null);
    setLocLabel(null);
    setRating(null);
    setBristol(null);
    setCaption('');
    setPhotoUris([]);
    queryClient.invalidateQueries({ queryKey: ['my-logs'] });
    queryClient.invalidateQueries({ queryKey: ['my-log-count'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    Alert.alert('Logged', 'Added to your map.');
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-28"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-50">Log a visit</Text>
      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Drop it anywhere — it’s your map.
      </Text>

      <Field>
        <Label>Location — required</Label>
        <LocationPicker
          coords={coords}
          label={locLabel}
          onPick={(c, lbl) => {
            setCoords(c);
            setLocLabel(lbl);
          }}
        />
      </Field>

      <Field>
        <Label>How was it?</Label>
        <Stars value={rating ?? 0} onChange={(n) => setRating(n || null)} />
      </Field>

      <Field>
        <Label>Consistency</Label>
        <View className="flex-row flex-wrap gap-2">
          {BRISTOL.map(({ n, emoji, label }) => {
            const active = bristol === n;
            return (
              <Pressable
                key={n}
                onPress={() => setBristol(active ? null : n)}
                style={{ width: '22%', backgroundColor: active ? ACCENT : undefined }}
                className={`items-center rounded-xl border py-2.5 ${
                  active ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'
                }`}>
                <Text className="text-2xl">{emoji}</Text>
                <Text
                  className={`mt-1 text-[11px] ${
                    active ? 'font-semibold text-white' : 'text-neutral-600 dark:text-neutral-300'
                  }`}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field>
        <Label>How’d it go?</Label>
        <TextInput
          placeholder="the tale of the porcelain throne…"
          placeholderTextColor="#9CA3AF"
          value={caption}
          onChangeText={setCaption}
          multiline
          className={`${inputCls} min-h-20`}
        />
      </Field>

      <Field>
        <Label>Photos</Label>
        <View className="flex-row flex-wrap gap-2">
          {photoUris.map((uri, i) => (
            <View key={`${uri}-${i}`}>
              <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />
              <Pressable
                onPress={() => setPhotoUris((p) => p.filter((_, j) => j !== i))}
                hitSlop={6}
                style={{ position: 'absolute', top: -6, right: -6 }}
                className="h-5 w-5 items-center justify-center rounded-full bg-black/70">
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photoUris.length < 4 ? (
            <Pressable
              onPress={addPhotos}
              className="h-[72px] w-[72px] items-center justify-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
              <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </Field>

      <Field>
        <Label>Who can see it?</Label>
        <View className="flex-row gap-2">
          {(['friends', 'private'] as const).map((v) => {
            const active = visibility === v;
            return (
              <Pressable
                key={v}
                onPress={() => setVisibility(v)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${
                  active ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                style={active ? { backgroundColor: ACCENT } : undefined}>
                <Ionicons
                  name={v === 'friends' ? 'people-outline' : 'lock-closed-outline'}
                  size={16}
                  color={active ? '#fff' : '#9CA3AF'}
                />
                <Text className={active ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>
                  {v === 'friends' ? 'Friends' : 'Private'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Pressable
        onPress={submit}
        disabled={busy}
        className={`mt-6 items-center rounded-xl py-4 ${busy ? 'opacity-50' : ''}`}
        style={{ backgroundColor: coords ? ACCENT : '#9CA3AF' }}>
        <Text className="text-base font-semibold text-white">{busy ? 'Logging…' : 'Log it'}</Text>
      </Pressable>
    </ScrollView>
  );
}
