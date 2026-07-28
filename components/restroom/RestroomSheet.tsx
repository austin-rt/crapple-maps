import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import { useRestroomCodes, useRestroomInfo, useRestroomReviews, useRestroomVisits } from '@/hooks/useRestroom';
import { useResolvedPlace } from '@/hooks/useResolvedPlace';
import { useSavedRestroom } from '@/hooks/useSaved';
import { useAuth } from '@/lib/auth';
import { addCodes, deleteCodes } from '@/lib/db/codes';
import { addReview } from '@/lib/db/reviews';
import { updateRestroom } from '@/lib/db/restrooms';
import { toast } from '@/lib/toast';
import { isGenericName } from '@/lib/geocode';
import { openDirections } from '@/lib/maps';
import { distLabel } from '@/lib/restrooms/filters';
import { ACCENT, DANGER } from '@/lib/tokens';
import type { Restroom, RestroomDraft } from '@/lib/types';

import { ActionRow } from './ActionRow';
import { AmenityChips } from './AmenityChips';
import { CodesSection } from './CodesSection';
import { DirectionsSection } from './DirectionsSection';
import { EditForm } from './EditForm';
import { InfoSection } from './InfoSection';
import { ReviewsSection } from './ReviewsSection';
import { VisitsSection } from './VisitsSection';

export type SheetRestroom = Restroom;

export function RestroomSheet({
  restroom,
  title,
  onBack,
  onTitlePress,
}: {
  restroom: Restroom;
  title: string;
  onBack: () => void;
  onTitlePress?: () => void;
}) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const place = useResolvedPlace(restroom.lat, restroom.lng, true);

  const { data: info } = useRestroomInfo(restroom.id);
  const { data: codes = [] } = useRestroomCodes(restroom.id);
  const { data: reviews = [] } = useRestroomReviews(restroom.id);
  const { data: visits = [] } = useRestroomVisits(restroom.id, uid);
  const { saved, toggle: toggleSave, canSave } = useSavedRestroom(restroom.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<RestroomDraft | null>(null);

  const requireAuth = () => {
    toast.info('Account required', 'Sign in to contribute.');
    router.navigate('/(tabs)/profile');
  };

  const displayTitle = isGenericName(restroom.name) && place?.title ? place.title : title;
  const rated = reviews.filter((r) => r.overall_rating);
  const revAvg = rated.length ? rated.reduce((s, r) => s + (r.overall_rating || 0), 0) / rated.length : 0;

  const startEdit = () => {
    setDraft({
      name: restroom.name ?? '',
      lat: restroom.lat,
      lng: restroom.lng,
      accessible: restroom.accessible,
      unisex: restroom.unisex,
      changing_table: restroom.changing_table,
      access_type: restroom.access_type,
      requires_code: info?.requires_code ?? null,
      purchase_required: info?.purchase_required ?? null,
      directions: info?.directions ?? '',
      codes: codes.map((c) => c.code),
    });
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!session || !draft) return requireAuth();
    setSaving(true);
    try {
      await updateRestroom(restroom.id, {
        directions: draft.directions.trim() || null,
        requires_code: draft.requires_code,
        purchase_required: draft.purchase_required,
      });
      const toDelete = codes.filter((c) => !draft.codes.includes(c.code)).map((c) => c.id);
      const toInsert = draft.codes.filter((c) => !codes.some((e) => e.code === c));
      await deleteCodes(toDelete);
      await addCodes(restroom.id, toInsert, session.user.id);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['restroom-info', restroom.id] });
      qc.invalidateQueries({ queryKey: ['codes', restroom.id] });
      toast.success('Listing updated');
    } catch (e: any) {
      toast.error('Could not save', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${restroom.lat},${restroom.lng}`;
    try {
      await Share.share({ message: `${title}\n${url}` });
    } catch {
      try {
        await navigator.clipboard?.writeText(url);
        toast.success('Link copied');
      } catch {}
    }
  };

  const onToggleSave = async () => {
    if (!canSave) return requireAuth();
    try {
      await toggleSave();
      toast.success(saved ? 'Removed from saved' : 'Saved');
    } catch (e: any) {
      toast.error("Couldn't update saved", e?.message);
    }
  };

  const quickAddCode = async (code: string) => {
    if (!session) return requireAuth();
    try {
      await addCodes(restroom.id, [code], session.user.id);
      qc.invalidateQueries({ queryKey: ['codes', restroom.id] });
      toast.success('Code added');
    } catch (e: any) {
      toast.error("Couldn't add code", e?.message);
    }
  };

  const submitReview = async (rating: number, text: string) => {
    if (!session) return requireAuth();
    try {
      await addReview({ restroomId: restroom.id, userId: session.user.id, rating: rating || null, description: text || null });
      qc.invalidateQueries({ queryKey: ['reviews', restroom.id] });
      toast.success('Review posted');
    } catch (e: any) {
      toast.error("Couldn't post review", e?.message);
    }
  };

  return (
    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} hitSlop={8} className="mb-3 flex-row items-center gap-1 self-start">
        <Ionicons name="chevron-back" size={18} color={ACCENT} />
        <Text className="text-sm font-semibold" style={{ color: ACCENT }}>All restrooms</Text>
      </Pressable>

      <Pressable onPress={onTitlePress} className="active:opacity-70">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{displayTitle}</Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {revAvg ? `★ ${revAvg.toFixed(1)} (${rated.length})  ·  ` : ''}
          {restroom.access_type ? '' : 'Restroom'}
          {distLabel(restroom.dist) ? `  ·  ${distLabel(restroom.dist)} away` : ''}
        </Text>
      </Pressable>

      <ActionRow
        onDirections={() => openDirections(restroom.lat, restroom.lng, displayTitle)}
        saved={saved}
        onToggleSave={onToggleSave}
        onShare={share}
        editing={editing}
        onEditToggle={editing ? () => setEditing(false) : startEdit}
      />

      {editing ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: ACCENT + '14' }}>
          <Ionicons name="create-outline" size={15} color={ACCENT} />
          <Text className="flex-1 text-xs" style={{ color: ACCENT }}>Editing this listing.</Text>
        </View>
      ) : null}

      <AmenityChips restroom={restroom} info={info} />
      <InfoSection place={place} info={info} />
      <VisitsSection visits={session ? visits : []} />

      {editing && draft ? (
        <EditForm
          draft={draft}
          onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
          variant="edit"
          InputComponent={BottomSheetTextInput}
        />
      ) : (
        <>
          <DirectionsSection directions={info?.directions} />
          <CodesSection codes={codes} requiresCode={info?.requires_code} canAdd={!!session} onAdd={quickAddCode} onRequireAuth={requireAuth} />
        </>
      )}

      <ReviewsSection reviews={reviews} editing={editing} canAdd={!!session} onSubmit={submitReview} onRequireAuth={requireAuth} />

      {editing ? (
        <View className="mt-8 flex-row gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <Pressable
            onPress={saveEdits}
            disabled={saving}
            className={`flex-1 items-center rounded-xl py-3.5 ${saving ? 'opacity-60' : 'active:opacity-80'}`}
            style={{ backgroundColor: ACCENT }}>
            <Text className="text-base font-semibold text-white">{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setEditing(false)}
            disabled={saving}
            className="items-center justify-center rounded-xl border px-6 active:opacity-70"
            style={{ borderColor: DANGER }}>
            <Text className="font-semibold" style={{ color: DANGER }}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
    </BottomSheetScrollView>
  );
}
