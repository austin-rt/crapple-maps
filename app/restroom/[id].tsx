import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppMapView, AppMarker } from '@/components/map';

import { ACCENT, useAuth } from '@/lib/auth';
import { MAP_PROVIDER, openDirections } from '@/lib/maps';
import { supabase } from '@/lib/supabase';

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

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} hitSlop={6} onPress={() => onChange(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={26} color={n <= value ? ACCENT : '#9CA3AF'} />
        </Pressable>
      ))}
    </View>
  );
}

export default function RestroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const { data: r } = useQuery({
    queryKey: ['restroom', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('restrooms')
        .select('name,address,city,lat,lng,access_type,accessible,unisex,changing_table,hours,directions,description')
        .eq('id', id)
        .single();
      return data;
    },
  });
  const { data: codes } = useQuery({
    queryKey: ['codes', id],
    queryFn: async () => {
      const { data } = await supabase.from('codes').select('id,code,posted_at').eq('restroom_id', id).order('posted_at', { ascending: false }).limit(5);
      return data ?? [];
    },
  });
  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('id,overall_rating,description,created_at').eq('restroom_id', id).is('deleted_at', null).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const requireAuth = () => {
    Alert.alert('Sign in', 'Sign in on the Profile tab to contribute.');
    return false;
  };

  const addCode = async () => {
    if (!session) return requireAuth();
    if (!newCode.trim()) return;
    const { error } = await supabase.from('codes').insert({ restroom_id: id, code: newCode.trim(), posted_by: session.user.id });
    if (error) return Alert.alert('Error', error.message);
    setNewCode('');
    qc.invalidateQueries({ queryKey: ['codes', id] });
  };

  const addReview = async () => {
    if (!session) return requireAuth();
    if (!rating && !reviewText.trim()) return Alert.alert('Add something', 'A rating or a note.');
    const { error } = await supabase.from('reviews').insert({
      restroom_id: id,
      user_id: session.user.id,
      overall_rating: rating || null,
      description: reviewText.trim() || null,
    });
    if (error) return Alert.alert('Error', error.message);
    setRating(0);
    setReviewText('');
    qc.invalidateQueries({ queryKey: ['reviews', id] });
  };

  const access = r?.access_type ? ACCESS[r.access_type] : null;
  const inputCls = 'rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50';
  const H = ({ children }: { children: string }) => (
    <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{children}</Text>
  );

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: r?.name || 'Restroom' }} />

      {r?.lat != null && r?.lng != null ? (
        <View style={{ marginHorizontal: -20, height: 200 }}>
          <AppMapView
            provider={MAP_PROVIDER}
            style={{ flex: 1 }}
            pointerEvents="none"
            initialRegion={{ latitude: r.lat, longitude: r.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}>
            <AppMarker coordinate={{ latitude: r.lat, longitude: r.lng }} pinColor={ACCENT} />
          </AppMapView>
        </View>
      ) : null}

      <Text className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{r?.name || 'Public Restroom'}</Text>
      {r?.address ? <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{r.address}</Text> : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        {access ? (
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: access.color + '22' }}>
            <Text className="text-xs font-semibold" style={{ color: access.color }}>{access.label}</Text>
          </View>
        ) : null}
        {r?.accessible ? <Chip icon="accessibility" label="Accessible" /> : null}
        {r?.unisex ? <Chip icon="male-female" label="Unisex" /> : null}
        {r?.changing_table ? <Chip icon="body" label="Changing table" /> : null}
      </View>
      {r?.directions ? <Text className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">📍 {r.directions}</Text> : null}
      {r?.hours ? <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">🕑 {r.hours}</Text> : null}

      {r?.lat != null && r?.lng != null ? (
        <Pressable
          onPress={() => openDirections(r.lat as number, r.lng as number, r.name || 'Restroom')}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
          style={{ backgroundColor: ACCENT }}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text className="text-base font-semibold text-white">Get directions</Text>
        </Pressable>
      ) : null}

      {/* codes */}
      <H>Access codes</H>
      {codes && codes.length > 0 ? (
        codes.map((c) => (
          <View key={c.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
            <Text className="text-lg font-bold tracking-widest text-neutral-900 dark:text-neutral-50">{c.code}</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">confirmed {timeAgo(c.posted_at)}</Text>
          </View>
        ))
      ) : (
        <Text className="text-sm text-neutral-400">No codes yet.</Text>
      )}
      <View className="mt-2 flex-row gap-2">
        <TextInput placeholder="Add a code…" placeholderTextColor="#9CA3AF" value={newCode} onChangeText={setNewCode} className={`${inputCls} flex-1`} />
        <Pressable onPress={addCode} className="items-center justify-center rounded-xl px-5" style={{ backgroundColor: ACCENT }}>
          <Text className="font-semibold text-white">Post</Text>
        </Pressable>
      </View>

      {/* reviews */}
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
      <View className="mt-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <Text className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">Leave a review</Text>
        <Stars value={rating} onChange={setRating} />
        <TextInput placeholder="How was it?" placeholderTextColor="#9CA3AF" value={reviewText} onChangeText={setReviewText} multiline className={`${inputCls} mt-3 min-h-16`} />
        <Pressable onPress={addReview} className="mt-3 items-center rounded-xl py-3" style={{ backgroundColor: ACCENT }}>
          <Text className="font-semibold text-white">Post review</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
      <Ionicons name={icon} size={13} color="#6B7280" />
      <Text className="text-xs text-neutral-600 dark:text-neutral-300">{label}</Text>
    </View>
  );
}
