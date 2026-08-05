import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MapPinPicker } from '@/components/map-pin-picker';
import { EditForm, PlaceSearchField, type PickedPlace } from '@/components/restroom';
import { SectionHeader } from '@/components/ui';
import { reverseGeocode } from '@/lib/geocode';
import { useAuth } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { useContribution } from '@/lib/contribution';
import { addCodes } from '@/lib/db/codes';
import { createRestroom } from '@/lib/db/restrooms';
import { ACCENT } from '@/lib/tokens';
import type { RestroomDraft } from '@/lib/types';

export default function NewRestroom() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { stashRestroom, takeRestroom } = useContribution();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const lat0 = parseFloat(params.lat ?? '') || 37.7749;
  const lng0 = parseFloat(params.lng ?? '') || -122.4194;

  const [draft, setDraft] = useState<RestroomDraft>({
    name: '',
    lat: lat0,
    lng: lng0,
    address: '',
    accessible: null,
    unisex: null,
    changing_table: null,
    access_type: null,
    requires_code: null,
    purchase_required: null,
    directions: '',
    codes: [],
  });
  const [saving, setSaving] = useState(false);
  // Bumped only when a search result is picked, so the map re-centers there.
  // Dragging the pin must NOT bump it, or the map would fight the drag.
  const [centerKey, setCenterKey] = useState(0);
  // Starts wide enough to orient, tightens once they've chosen a specific place.
  const [zoom, setZoom] = useState(16);
  // Once they type in a field it's theirs, and the pin stops overwriting it.
  // A search pick is an explicit re-selection of the whole place, so it clears
  // both flags and wins — otherwise picking a second place would strand the
  // first place's name on the form.
  const addressEdited = useRef(false);
  const nameEdited = useRef(false);

  const patch = (p: Partial<RestroomDraft>) => setDraft((d) => ({ ...d, ...p }));

  const editField = (p: Partial<RestroomDraft>) => {
    if ('address' in p) addressEdited.current = true;
    if ('name' in p) nameEdited.current = true;
    patch(p);
  };

  const pickPlace = (p: PickedPlace) => {
    setDraft((d) => ({
      ...d,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      // Keep a hand-typed name; replace one we filled in from an earlier pick.
      // A result with no place name (a bare street address) never blanks it.
      name: nameEdited.current || !p.title ? d.name : p.title,
    }));
    addressEdited.current = false;
    setZoom(18);
    setCenterKey((k) => k + 1);
  };

  // Dragging the pin re-derives the address from the new coordinate, unless
  // they've hand-edited it.
  const movePin = (c: { latitude: number; longitude: number }) => {
    patch({ lat: c.latitude, lng: c.longitude });
    if (addressEdited.current) return;
    reverseGeocode(c.latitude, c.longitude)
      .then((place) => {
        if (!place || addressEdited.current) return;
        setDraft((d) =>
          // Guard against a stale response landing after another drag.
          d.lat === c.latitude && d.lng === c.longitude ? { ...d, address: place.full } : d,
        );
      })
      .catch(() => {});
  };

  // If they filled this out logged-out and just signed in, restore their draft.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const resumed = takeRestroom();
    if (resumed) setDraft(resumed);
  }, [takeRestroom]);

  const submit = async () => {
    // Gate at submit (not entry): toast, stash the draft, send them to sign in, and
    // the ContributionProvider brings them back here with it intact.
    if (!session) {
      toast.info('Account required', 'Sign in to add a restroom. We saved what you typed.');
      stashRestroom(draft);
      router.navigate('/(tabs)/profile');
      return;
    }
    setSaving(true);
    try {
      const id = await createRestroom({
        name: draft.name.trim() || null,
        lat: draft.lat,
        lng: draft.lng,
        address: draft.address.trim() || null,
        access_type: draft.access_type,
        accessible: draft.accessible,
        unisex: draft.unisex,
        changing_table: draft.changing_table,
        requires_code: draft.requires_code,
        purchase_required: draft.purchase_required,
        directions: draft.directions.trim() || null,
        added_by: session.user.id,
      });
      if (draft.codes.length) await addCodes(id, draft.codes, session.user.id);
      qc.invalidateQueries({ queryKey: ['finder'] });
      router.replace({ pathname: '/(tabs)', params: { flat: String(draft.lat), flng: String(draft.lng) } });
      toast.success('Added', 'Thanks. Your restroom is on the map.');
    } catch (e: any) {
      toast.error('Could not add', e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: 'Add a restroom' }} />

      <SectionHeader>Location</SectionHeader>
      {/* Search sits on the map like the finder's, rather than above it. */}
      <View className="mt-3">
        <MapPinPicker
          flush
          coords={{ latitude: draft.lat, longitude: draft.lng }}
          onChange={movePin}
          height={360}
          centerKey={centerKey}
          zoom={zoom}
        />
        <View style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 20 }}>
          <PlaceSearchField onPick={pickPlace} />
        </View>
      </View>
      <Text className="mt-2 text-xs text-content-2">Drag the map to put the pin on the exact spot.</Text>

      <EditForm draft={draft} onChange={editField} variant="create" />

      <Pressable
        onPress={submit}
        disabled={saving}
        className={`mt-8 items-center rounded-xl py-4 ${saving ? 'opacity-50' : ''}`}
        style={{ backgroundColor: ACCENT }}>
        <Text className="text-base font-semibold text-white">{saving ? 'Adding…' : 'Add restroom'}</Text>
      </Pressable>
    </ScrollView>
  );
}
