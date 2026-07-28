import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { MapPinPicker } from '@/components/map-pin-picker';
import { EditForm } from '@/components/restroom';
import { SectionHeader } from '@/components/ui';
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
  const patch = (p: Partial<RestroomDraft>) => setDraft((d) => ({ ...d, ...p }));

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
      toast.info('Account required', 'Sign in to add a restroom — we saved what you typed.');
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
      toast.success('Added', 'Thanks — your restroom is on the map.');
    } catch (e: any) {
      toast.error('Could not add', e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: 'Add a restroom' }} />

      <SectionHeader>Location</SectionHeader>
      <MapPinPicker coords={{ latitude: draft.lat, longitude: draft.lng }} onChange={(c) => patch({ lat: c.latitude, lng: c.longitude })} />

      <EditForm draft={draft} onChange={patch} variant="create" />

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
