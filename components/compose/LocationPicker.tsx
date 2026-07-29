import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { MapPinPicker } from '@/components/map-pin-picker';
import { usePlaceSearch, type Place } from '@/hooks/usePlaceSearch';
import { notify } from '@/lib/confirm';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

type Coords = { latitude: number; longitude: number };

export function LocationPicker({
  coords,
  label,
  onPick,
}: {
  coords: Coords | null;
  label: string | null;
  onPick: (c: Coords, label: string) => void;
}) {
  const [query, setQuery] = useState('');
  const { results, searching } = usePlaceSearch(query);
  const [locating, setLocating] = useState(false);

  const pick = (p: Place) => {
    onPick({ latitude: parseFloat(p.lat), longitude: parseFloat(p.lon) }, p.display_name);
    setQuery('');
  };

  const useCurrent = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        notify('Location off', 'Search an address instead.');
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

  const c = useColors();
  return (
    <View>
      {coords ? (
        <View className="mb-3 flex-row items-start gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
          <Ionicons name="location" size={18} color={ACCENT} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-sm text-content">{label}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center rounded-xl border border-neutral-300 px-3 dark:border-neutral-700">
        <Ionicons name="search" size={16} color={c.content2} />
        <TextInput
          placeholder="Search an address or place…"
          placeholderTextColor={c.content2}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          className="flex-1 px-2 py-3 text-base text-content"
        />
        {searching ? <ActivityIndicator size="small" color={c.content2} /> : null}
      </View>

      {results.length > 0 ? (
        <View className="mt-2 overflow-hidden rounded-xl border border-line">
          {results.map((p, i) => (
            <Pressable
              key={`${p.lat}-${p.lon}-${i}`}
              onPress={() => pick(p)}
              className="border-b border-neutral-100 px-3 py-3 active:bg-neutral-100 dark:border-neutral-900 dark:active:bg-neutral-900">
              <Text numberOfLines={2} className="text-sm text-content">
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
        <Text className="font-semibold text-content">
          {locating ? 'Locating…' : 'Use my current location'}
        </Text>
      </Pressable>

      {/* Once a rough point is chosen, let them nudge the exact spot (Uber-style). */}
      {coords ? <MapPinPicker coords={coords} onChange={(c) => onPick(c, label ?? 'Pinned location')} /> : null}
    </View>
  );
}
