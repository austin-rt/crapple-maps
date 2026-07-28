import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { LocationPicker } from '@/components/compose/LocationPicker';
import { INPUT_CLS, SignInRequired, Stars } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { BRISTOL } from '@/lib/bristol';
import { confirmAction } from '@/lib/confirm';
import { createLog } from '@/lib/db/logs';
import { createRestroom, fetchNearestId } from '@/lib/db/restrooms';
import { pickLogPhotos, uploadLogPhotos } from '@/lib/photos';
import { toast } from '@/lib/toast';
import { ACCENT, MUTED } from '@/lib/tokens';
import type { Visibility } from '@/lib/types';

type Coords = { latitude: number; longitude: number };

function Label({ children }: { children: string }) {
  return <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{children}</Text>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <View className="border-b border-neutral-100 py-5 dark:border-neutral-900">{children}</View>;
}

export default function ComposeScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [bristol, setBristol] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [busy, setBusy] = useState(false);
  // undefined = not checked yet, null = new spot (no restroom nearby), string = existing restroom id
  const [nearId, setNearId] = useState<string | null | undefined>(undefined);
  const [alsoPublish, setAlsoPublish] = useState(false);
  const isNewSpot = nearId === null;

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

  // Is there already a restroom at this spot? Drives the "add it to the map" offer.
  useEffect(() => {
    if (!coords) {
      setNearId(undefined);
      setAlsoPublish(false);
      return;
    }
    let on = true;
    setNearId(undefined);
    fetchNearestId(coords.latitude, coords.longitude, 60)
      .then((id) => on && setNearId(id))
      .catch(() => on && setNearId(undefined));
    return () => {
      on = false;
    };
  }, [coords]);

  const addPhotos = async () => {
    const uris = await pickLogPhotos(4 - photoUris.length);
    if (uris.length) setPhotoUris((p) => [...p, ...uris].slice(0, 4));
  };

  if (!session) {
    return <SignInRequired message="Log a visit." />;
  }

  const doSubmit = async (publish: boolean) => {
    if (!coords) return;
    setBusy(true);
    try {
      let restroomId: string | null = nearId ?? null;
      if (publish) {
        restroomId = await createRestroom({ name: null, lat: coords.latitude, lng: coords.longitude, added_by: session.user.id });
      }
      const logId = await createLog({
        userId: session.user.id,
        lat: coords.latitude,
        lng: coords.longitude,
        restroomId,
        rating,
        bristolType: bristol,
        caption: caption.trim() || null,
        visibility,
      });
      if (photoUris.length) {
        try {
          await uploadLogPhotos(logId, session.user.id, photoUris);
        } catch (e: any) {
          toast.error('Photo upload failed', e?.message ?? 'The log was still saved.');
        }
      }
      setCoords(null);
      setLocLabel(null);
      setRating(null);
      setBristol(null);
      setCaption('');
      setPhotoUris([]);
      setAlsoPublish(false);
      queryClient.invalidateQueries({ queryKey: ['my-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-log-count'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['logged-restroom-ids'] });
      if (publish) queryClient.invalidateQueries({ queryKey: ['finder'] });
      toast.success('Logged', publish ? 'Added to your map and the public registry.' : 'Added to your map.');
    } catch (e: any) {
      toast.error('Could not save', e?.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!coords) return toast.error('Pick a location', 'Search an address or use your current location.');
    if (isNewSpot && alsoPublish) {
      confirmAction(
        'Add to the public map?',
        'Publish this restroom to the public registry so others can find it too?',
        () => doSubmit(true),
        { confirmLabel: 'Publish', onCancel: () => doSubmit(false) },
      );
    } else {
      doSubmit(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-28"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-50">Log a visit</Text>
      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Drop it anywhere. It’s your map.</Text>

      <Field>
        <Label>Location required</Label>
        <LocationPicker
          coords={coords}
          label={locLabel}
          onPick={(c, lbl) => {
            setCoords(c);
            setLocLabel(lbl);
          }}
        />
      </Field>

      {isNewSpot ? (
        <Field>
          <Pressable onPress={() => setAlsoPublish((v) => !v)} className="flex-row items-center gap-3 active:opacity-70">
            <View
              className="h-6 w-6 items-center justify-center rounded-md border"
              style={{ borderColor: alsoPublish ? ACCENT : MUTED, backgroundColor: alsoPublish ? ACCENT : 'transparent' }}>
              {alsoPublish ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50">This spot isn’t on the map yet</Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">Add it so others can find this restroom</Text>
            </View>
          </Pressable>
        </Field>
      ) : null}

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
                className={`items-center rounded-xl border py-2.5 ${active ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}>
                <Text className="text-2xl">{emoji}</Text>
                <Text className={`mt-1 text-[11px] ${active ? 'font-semibold text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field>
        <Label>How’d it go?</Label>
        <TextInput
          placeholder="the tale of the porcelain throne…"
          placeholderTextColor={MUTED}
          value={caption}
          onChangeText={setCaption}
          multiline
          className={`${INPUT_CLS} min-h-20`}
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
              <Ionicons name="camera-outline" size={22} color={MUTED} />
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
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${active ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                style={active ? { backgroundColor: ACCENT } : undefined}>
                <Ionicons name={v === 'friends' ? 'people-outline' : 'lock-closed-outline'} size={16} color={active ? '#fff' : MUTED} />
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
        style={{ backgroundColor: coords ? ACCENT : MUTED }}>
        <Text className="text-base font-semibold text-white">{busy ? 'Logging…' : 'Log it'}</Text>
      </Pressable>
    </ScrollView>
  );
}
