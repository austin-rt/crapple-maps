import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Stars } from '@/components/stars';
import { ACCENT, useAuth } from '@/lib/auth';
import { isGenericName, reverseGeocode, type Place } from '@/lib/geocode';
import { openDirections } from '@/lib/maps';
import { supabase } from '@/lib/supabase';

export type SheetRestroom = {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  access_type: 'public' | 'customers_only' | 'code' | 'ask_staff' | null;
  accessible: boolean | null;
  unisex: boolean | null;
  changing_table: boolean | null;
  dist: number | null;
};

const ACCESS: Record<string, { label: string; color: string }> = {
  public: { label: 'Public', color: '#16A34A' },
  code: { label: 'Code required', color: '#D97706' },
  ask_staff: { label: 'Ask staff for key', color: '#DC2626' },
  customers_only: { label: 'Customers only', color: '#2563EB' },
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function distLabel(d: number | null) {
  if (d == null) return null;
  return d < 0.1 ? `${Math.round(d * 5280)} ft away` : `${d.toFixed(1)} mi away`;
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
      <Ionicons name={icon} size={13} color="#6B7280" />
      <Text className="text-xs text-neutral-600 dark:text-neutral-300">{label}</Text>
    </View>
  );
}

// Google-Maps-style round action button with label.
function ActionBtn({ icon, label, onPress, filled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="items-center gap-1">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${filled ? '' : 'border border-neutral-300 dark:border-neutral-700'}`}
        style={filled ? { backgroundColor: ACCENT } : undefined}>
        <Ionicons name={icon} size={20} color={filled ? '#fff' : ACCENT} />
      </View>
      <Text className="text-xs text-neutral-600 dark:text-neutral-300">{label}</Text>
    </Pressable>
  );
}

// Leading-icon info row (Google Maps place-info style).
function InfoRow({ icon, children, onPress }: { icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode; onPress?: () => void }) {
  const body = (
    <View className="flex-row items-start gap-3 py-2.5">
      <Ionicons name={icon} size={18} color="#9CA3AF" style={{ marginTop: 1 }} />
      <View className="flex-1">{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} className="active:opacity-70">
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function RestroomSheet({
  restroom,
  title,
  onBack,
  onTitlePress,
}: {
  restroom: SheetRestroom;
  title: string;
  onBack: () => void;
  onTitlePress?: () => void;
}) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [place, setPlace] = useState<Place | null>(null);
  const [newCode, setNewCode] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [dirText, setDirText] = useState('');
  const [editing, setEditing] = useState(false); // view by default; top-level Edit for listing facts
  const [addingCode, setAddingCode] = useState(false); // per-field: codes change often
  const [writingReview, setWritingReview] = useState(false); // per-field, same as codes

  useEffect(() => {
    let on = true;
    setPlace(null);
    reverseGeocode(restroom.lat, restroom.lng, true).then((p) => on && setPlace(p));
    return () => {
      on = false;
    };
  }, [restroom.id, restroom.lat, restroom.lng]);

  const displayTitle = isGenericName(restroom.name) && place?.title ? place.title : title;

  const { data: info } = useQuery({
    queryKey: ['restroom-info', restroom.id],
    queryFn: async () => {
      const { data } = await supabase.from('restrooms').select('directions,hours,description,purchase_required,requires_code').eq('id', restroom.id).single();
      return data;
    },
  });
  useEffect(() => {
    setDirText(info?.directions ?? '');
  }, [info?.directions]);

  const saveDirections = async () => {
    if (!session) return requireAuth();
    const { error } = await supabase.from('restrooms').update({ directions: dirText.trim() || null }).eq('id', restroom.id);
    if (error) return Alert.alert('Error', error.message);
    qc.invalidateQueries({ queryKey: ['restroom-info', restroom.id] });
  };

  const savePurchase = async (val: boolean | null) => {
    if (!session) return requireAuth();
    const { error } = await supabase.from('restrooms').update({ purchase_required: val }).eq('id', restroom.id);
    if (error) return Alert.alert('Error', error.message);
    qc.invalidateQueries({ queryKey: ['restroom-info', restroom.id] });
  };

  const saveRequiresCode = async (val: boolean | null) => {
    if (!session) return requireAuth();
    const { error } = await supabase.from('restrooms').update({ requires_code: val }).eq('id', restroom.id);
    if (error) return Alert.alert('Error', error.message);
    qc.invalidateQueries({ queryKey: ['restroom-info', restroom.id] });
  };

  const share = () => {
    Share.share({
      message: `${title} — https://www.google.com/maps/search/?api=1&query=${restroom.lat},${restroom.lng}`,
    }).catch(() => {});
  };
  const save = () => Alert.alert('Saved', 'Saved places are coming soon.');

  const { data: codes } = useQuery({
    queryKey: ['codes', restroom.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('codes')
        .select('id,code,posted_at')
        .eq('restroom_id', restroom.id)
        .order('posted_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });
  const { data: reviews } = useQuery({
    queryKey: ['reviews', restroom.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id,overall_rating,description,created_at')
        .eq('restroom_id', restroom.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });
  const { data: visits } = useQuery({
    queryKey: ['my-visits', restroom.id, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from('logs')
        .select('id,created_at,caption')
        .eq('restroom_id', restroom.id)
        .eq('user_id', session!.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const requireAuth = () => router.navigate('/(tabs)/profile');

  const addCode = async () => {
    if (!session) return requireAuth();
    if (!newCode.trim()) return;
    const { error } = await supabase.from('codes').insert({ restroom_id: restroom.id, code: newCode.trim(), posted_by: session.user.id });
    if (error) return Alert.alert('Error', error.message);
    setNewCode('');
    qc.invalidateQueries({ queryKey: ['codes', restroom.id] });
  };

  const addReview = async () => {
    if (!session) return requireAuth();
    if (!rating && !reviewText.trim()) return Alert.alert('Add something', 'A rating or a note.');
    const { error } = await supabase.from('reviews').insert({
      restroom_id: restroom.id,
      user_id: session.user.id,
      overall_rating: rating || null,
      description: reviewText.trim() || null,
    });
    if (error) return Alert.alert('Error', error.message);
    setRating(0);
    setReviewText('');
    qc.invalidateQueries({ queryKey: ['reviews', restroom.id] });
  };

  const access = restroom.access_type ? ACCESS[restroom.access_type] : null;
  const rated = (reviews ?? []).filter((r) => r.overall_rating);
  const revAvg = rated.length ? rated.reduce((s, r) => s + (r.overall_rating || 0), 0) / rated.length : 0;
  const inputCls =
    'rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50';
  const H = ({ children }: { children: string }) => (
    <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{children}</Text>
  );

  return (
    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} hitSlop={8} className="mb-3 flex-row items-center gap-1 self-start">
        <Ionicons name="chevron-back" size={18} color={ACCENT} />
        <Text className="text-sm font-semibold" style={{ color: ACCENT }}>All restrooms</Text>
      </Pressable>

      {/* Tappable title — snaps the drawer down so the pin shows on the map */}
      <Pressable onPress={onTitlePress} className="active:opacity-70">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{displayTitle}</Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {revAvg ? `★ ${revAvg.toFixed(1)} (${rated.length})  ·  ` : ''}
          {access?.label ?? 'Restroom'}
          {distLabel(restroom.dist) ? `  ·  ${distLabel(restroom.dist)}` : ''}
        </Text>
      </Pressable>

      {/* Google-Maps-style action row */}
      <View className="mt-4 flex-row gap-6">
        <ActionBtn icon="navigate" label="Directions" filled onPress={() => openDirections(restroom.lat, restroom.lng, displayTitle)} />
        <ActionBtn icon="bookmark-outline" label="Save" onPress={save} />
        <ActionBtn icon="share-outline" label="Share" onPress={share} />
        <ActionBtn
          icon={editing ? 'checkmark-circle' : 'create-outline'}
          label={editing ? 'Done' : 'Edit'}
          filled={editing}
          onPress={() => setEditing((e) => !e)}
        />
      </View>

      {editing ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: ACCENT + '14' }}>
          <Ionicons name="create-outline" size={15} color={ACCENT} />
          <Text className="flex-1 text-xs" style={{ color: ACCENT }}>Editing this listing — update how to find it, whether it needs a code, and purchase info.</Text>
        </View>
      ) : null}

      {access || restroom.accessible || restroom.unisex || restroom.changing_table || info?.purchase_required || info?.requires_code ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {access ? (
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: access.color + '22' }}>
              <Text className="text-xs font-semibold" style={{ color: access.color }}>{access.label}</Text>
            </View>
          ) : null}
          {restroom.accessible ? <Chip icon="accessibility" label="Accessible" /> : null}
          {restroom.unisex ? <Chip icon="male-female" label="Unisex" /> : null}
          {restroom.changing_table ? <Chip icon="body" label="Changing table" /> : null}
          {info?.requires_code ? <Chip icon="keypad-outline" label="Code required" /> : null}
          {info?.purchase_required ? <Chip icon="card-outline" label="Purchase required" /> : null}
        </View>
      ) : null}

      <View className="mt-3 border-t border-neutral-100 pt-1 dark:border-neutral-800">
        <InfoRow icon="location-outline">
          <Text className="text-[15px] leading-5 text-neutral-700 dark:text-neutral-300">{place?.full || 'Locating…'}</Text>
        </InfoRow>
        {info?.hours ? (
          <InfoRow icon="time-outline">
            <Text className="text-[15px] leading-5 text-neutral-700 dark:text-neutral-300">{info.hours}</Text>
          </InfoRow>
        ) : null}
        {info?.description ? (
          <InfoRow icon="information-circle-outline">
            <Text className="text-[15px] leading-5 text-neutral-700 dark:text-neutral-300">{info.description}</Text>
          </InfoRow>
        ) : null}
      </View>

      {session && visits && visits.length > 0 ? (
        <>
          <H>Your visits here</H>
          {visits.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => router.push(`/log/${v.id}`)}
              className="mb-2 flex-row items-center justify-between gap-2 rounded-xl bg-neutral-100 px-4 py-3 active:opacity-70 dark:bg-neutral-900">
              <Text className="flex-1 text-sm text-neutral-800 dark:text-neutral-200" numberOfLines={1}>
                {v.caption || 'A visit'}
              </Text>
              <Text className="text-xs text-neutral-400">{new Date(v.created_at).toLocaleDateString()}</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {editing || info?.directions ? <H>How to find it</H> : null}
      {editing ? (
        <View>
          <BottomSheetTextInput
            placeholder="e.g. Around back — separate entrance to the left of the bar…"
            placeholderTextColor="#9CA3AF"
            value={dirText}
            onChangeText={setDirText}
            multiline
            className={`${inputCls} min-h-16`}
          />
          <Pressable onPress={saveDirections} className="mt-2 items-center rounded-xl py-3" style={{ backgroundColor: ACCENT }}>
            <Text className="font-semibold text-white">Save directions</Text>
          </Pressable>
        </View>
      ) : info?.directions ? (
        <View className="flex-row items-start gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
          <Ionicons name="navigate-circle-outline" size={18} color={ACCENT} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-[15px] leading-5 text-neutral-800 dark:text-neutral-200">{info.directions}</Text>
        </View>
      ) : null}

      {editing ? (
        <>
          <H>Requires a code?</H>
          <View className="flex-row gap-2">
            {([['Unknown', null], ['Yes', true], ['No', false]] as [string, boolean | null][]).map(([label, val]) => {
              const on = info?.requires_code === val;
              return (
                <Pressable
                  key={label}
                  onPress={() => saveRequiresCode(val)}
                  className={`flex-1 items-center rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                  style={on ? { backgroundColor: ACCENT } : undefined}>
                  <Text className={on ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <H>Purchase required?</H>
          <View className="flex-row gap-2">
            {([['Unknown', null], ['Yes', true], ['No', false]] as [string, boolean | null][]).map(([label, val]) => {
              const on = info?.purchase_required === val;
              return (
                <Pressable
                  key={label}
                  onPress={() => savePurchase(val)}
                  className={`flex-1 items-center rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'}`}
                  style={on ? { backgroundColor: ACCENT } : undefined}>
                  <Text className={on ? 'font-semibold text-white' : 'text-neutral-700 dark:text-neutral-300'}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {info?.requires_code !== false ? (
        <>
          <H>Access codes</H>
          {codes && codes.length > 0 ? (
            codes.map((c) => (
              <View key={c.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
                <Text className="text-lg font-bold tracking-widest text-neutral-900 dark:text-neutral-50">{c.code}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">confirmed {timeAgo(c.posted_at)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-neutral-400">
              {info?.requires_code === true ? 'Needs a code — none posted yet. Add one below.' : 'No codes reported yet.'}
            </Text>
          )}
          {addingCode ? (
            <View className="mt-2 flex-row gap-2">
              <BottomSheetTextInput autoFocus placeholder="Add a code…" placeholderTextColor="#9CA3AF" value={newCode} onChangeText={setNewCode} className={`${inputCls} flex-1`} />
              <Pressable
                onPress={async () => {
                  await addCode();
                  setAddingCode(false);
                }}
                className="items-center justify-center rounded-xl px-5"
                style={{ backgroundColor: ACCENT }}>
                <Text className="font-semibold text-white">Post</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => (session ? setAddingCode(true) : requireAuth())}
              className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70">
              <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
              <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Add a code</Text>
            </Pressable>
          )}
        </>
      ) : null}

      <H>Reviews</H>
      {reviews && reviews.length > 0 ? (
        reviews.map((rv) => (
          <View key={rv.id} className="mb-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
            {rv.overall_rating ? <Text style={{ color: ACCENT }}>{'★'.repeat(rv.overall_rating)}</Text> : null}
            {rv.description ? <Text className="mt-1 text-neutral-800 dark:text-neutral-200">{rv.description}</Text> : null}
            <Text className="mt-1 text-xs text-neutral-400">{timeAgo(rv.created_at)}</Text>
          </View>
        ))
      ) : (
        <Text className="text-sm text-neutral-400">No reviews yet.</Text>
      )}
      {writingReview ? (
        <View className="mt-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">Leave a review</Text>
          <Stars value={rating} onChange={setRating} />
          <BottomSheetTextInput placeholder="How was it?" placeholderTextColor="#9CA3AF" value={reviewText} onChangeText={setReviewText} multiline className={`${inputCls} mt-3 min-h-16`} />
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={async () => {
                await addReview();
                setWritingReview(false);
              }}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: ACCENT }}>
              <Text className="font-semibold text-white">Post review</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setWritingReview(false);
                setRating(0);
                setReviewText('');
              }}
              className="items-center justify-center rounded-xl border border-neutral-300 px-5 dark:border-neutral-700">
              <Text className="font-semibold text-neutral-700 dark:text-neutral-300">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => (session ? setWritingReview(true) : requireAuth())}
          className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70">
          <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
          <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Add a review</Text>
        </Pressable>
      )}
    </BottomSheetScrollView>
  );
}
