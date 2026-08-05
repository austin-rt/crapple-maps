import { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { usePlaceSearch, type Place } from '@/hooks/usePlaceSearch';
import { useColors } from '@/lib/theme';

export type PickedPlace = { lat: number; lng: number; title: string; address: string };

// Nominatim's display_name is a comma list, most-specific first:
//   "Native Foods, 210, South Clark Street, Chicago, …"  → named place
//   "210, South Clark Street, Chicago, …"                → plain street address
// A leading segment that is just a house number means there's no place name to
// take, so the title stays empty rather than becoming "210".
export function splitPlace(displayName: string): { title: string; address: string } {
  const parts = displayName.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { title: '', address: '' };
  const named = !/^\d+[a-z]?$/i.test(parts[0]);
  return named
    ? { title: parts[0], address: parts.slice(1).join(', ') }
    : { title: '', address: parts.join(', ') };
}

// Styled to sit on top of the map, matching the finder's search bar.
export function PlaceSearchField({ onPick }: { onPick: (p: PickedPlace) => void }) {
  const [query, setQuery] = useState('');
  const { results, searching } = usePlaceSearch(query);
  const inputRef = useRef<TextInput>(null);
  const c = useColors();

  const pick = (p: Place) => {
    // Clearing the query is what closes the results list (it drops below the
    // hook's 3-char minimum), so the map isn't left covered after a pick.
    setQuery('');
    inputRef.current?.blur();
    Keyboard.dismiss();
    const { title, address } = splitPlace(p.display_name);
    onPick({ lat: parseFloat(p.lat), lng: parseFloat(p.lon), title, address });
  };

  return (
    <View>
      <View className="flex-row items-center rounded-2xl bg-surface px-3" style={styles.shadow}>
        <Icon name="search" size={16} color={c.content2} />
        <TextInput
          ref={inputRef}
          placeholder="Search a place or address…"
          placeholderTextColor={c.content2}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          className="flex-1 px-2 py-3 text-base text-content"
        />
        {searching ? (
          <ActivityIndicator size="small" color={c.content2} />
        ) : query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <Icon name="close-circle" size={18} color={c.content2} />
          </Pressable>
        ) : null}
      </View>

      {results.length > 0 ? (
        <View className="mt-2 overflow-hidden rounded-2xl bg-surface" style={styles.shadow}>
          {results.map((p, i) => {
            const { title, address } = splitPlace(p.display_name);
            return (
              <Pressable
                key={`${p.lat}-${p.lon}-${i}`}
                onPress={() => pick(p)}
                className={`flex-row items-center gap-2 px-3 py-3 active:bg-surface-2 ${
                  i < results.length - 1 ? 'border-b border-line' : ''
                }`}>
                <Icon name="location-outline" size={16} color={c.content2} />
                <View className="flex-1">
                  {title ? <Text className="text-sm font-semibold text-content">{title}</Text> : null}
                  <Text numberOfLines={2} className={title ? 'text-xs text-content-2' : 'text-sm text-content'}>
                    {address}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
