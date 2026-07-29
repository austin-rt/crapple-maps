import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { INPUT_CLS, SectionHeader } from '@/components/ui';
import { daysAgo } from '@/lib/format';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import type { Code } from '@/lib/types';

import { SheetTextInput } from './sheet-inputs';

// View-mode access codes: confirmed list + a quick single-code add.
export function CodesSection({
  codes,
  requiresCode,
  canAdd,
  onAdd,
  onRequireAuth,
}: {
  codes: Code[];
  requiresCode: boolean | null | undefined;
  canAdd: boolean;
  onAdd: (code: string) => Promise<void>;
  onRequireAuth: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  if (requiresCode === false) return null;

  const post = async () => {
    if (!newCode.trim()) return;
    await onAdd(newCode.trim());
    setNewCode('');
    setAdding(false);
  };

  const c = useColors();
  return (
    <>
      <SectionHeader>Access codes</SectionHeader>
      {codes.length > 0 ? (
        codes.map((c) => (
          <View key={c.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
            <Text className="text-lg font-bold tracking-widest text-content">{c.code}</Text>
            <Text className="text-xs text-content-2">confirmed {daysAgo(c.posted_at)}</Text>
          </View>
        ))
      ) : (
        <Text className="text-sm text-content-2">
          {requiresCode === true ? 'Needs a code. None posted yet. Add one below.' : 'No codes reported yet.'}
        </Text>
      )}
      {adding ? (
        <View className="mt-2 flex-row gap-2">
          <SheetTextInput
            autoFocus
            placeholder="Add a code…"
            placeholderTextColor={c.content2}
            value={newCode}
            onChangeText={setNewCode}
            className={`${INPUT_CLS} flex-1`}
          />
          <Pressable onPress={post} className="items-center justify-center rounded-xl px-5" style={{ backgroundColor: ACCENT }}>
            <Text className="font-semibold text-white">Post</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => (canAdd ? setAdding(true) : onRequireAuth())}
          className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70">
          <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
          <Text className="text-sm font-semibold" style={{ color: ACCENT }}>Add a code</Text>
        </Pressable>
      )}
    </>
  );
}
