import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { INPUT_CLS, SectionHeader, Stars } from '@/components/ui';
import { daysAgo } from '@/lib/format';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import type { Review } from '@/lib/types';

import { SheetTextInput } from './sheet-inputs';

export function ReviewsSection({
  reviews,
  editing,
  canAdd,
  onSubmit,
  onRequireAuth,
}: {
  reviews: Review[];
  editing: boolean;
  canAdd: boolean;
  onSubmit: (rating: number, text: string) => Promise<void>;
  onRequireAuth: () => void;
}) {
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const submit = async () => {
    if (!rating && !text.trim()) return Alert.alert('Add something', 'A rating or a note.');
    await onSubmit(rating, text.trim());
    setRating(0);
    setText('');
    setWriting(false);
  };

  const c = useColors();
  return (
    <>
      <SectionHeader>Reviews</SectionHeader>
      {reviews.length > 0 ? (
        reviews.map((rv) => (
          <View key={rv.id} className="mb-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
            {rv.overall_rating ? <Text style={{ color: ACCENT }}>{'★'.repeat(rv.overall_rating)}</Text> : null}
            {rv.description ? <Text className="mt-1 text-neutral-800 dark:text-neutral-200">{rv.description}</Text> : null}
            <Text className="mt-1 text-xs text-neutral-400">{daysAgo(rv.created_at)}</Text>
          </View>
        ))
      ) : (
        <Text className="text-sm text-neutral-400">No reviews yet.</Text>
      )}

      {editing ? (
        <View className="mt-2 flex-row items-center gap-1.5 self-start opacity-40">
          <Ionicons name="add-circle-outline" size={18} color={c.content2} />
          <Text className="text-sm font-semibold text-neutral-400">Finish editing to add a review</Text>
        </View>
      ) : writing ? (
        <View className="mt-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">Leave a review</Text>
          <Stars value={rating} onChange={setRating} />
          <SheetTextInput
            placeholder="How was it?"
            placeholderTextColor={c.content2}
            value={text}
            onChangeText={setText}
            multiline
            className={`${INPUT_CLS} mt-3 min-h-16`}
          />
          <View className="mt-3 flex-row gap-2">
            <Pressable onPress={submit} className="flex-1 items-center rounded-xl py-3" style={{ backgroundColor: ACCENT }}>
              <Text className="font-semibold text-white">Post review</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setWriting(false);
                setRating(0);
                setText('');
              }}
              className="items-center justify-center rounded-xl border border-neutral-300 px-5 dark:border-neutral-700">
              <Text className="font-semibold text-neutral-700 dark:text-neutral-300">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => (canAdd ? setWriting(true) : onRequireAuth())}
          className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70">
          <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
          <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Add a review</Text>
        </Pressable>
      )}
    </>
  );
}
