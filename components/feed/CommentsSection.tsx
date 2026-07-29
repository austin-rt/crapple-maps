import Ionicons from '@expo/vector-icons/Ionicons';
import type { Session } from '@supabase/supabase-js';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { useComments } from '@/hooks/useComments';
import { timeAgo } from '@/lib/format';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// Comments list + composer for the post detail. Works on native and web (plain
// TextInput; this screen is a ScrollView route, not a bottom sheet).
export function CommentsSection({ logId, session }: { logId: string; session: Session | null }) {
  const { comments, isLoading, add, remove, adding } = useComments(logId);
  const [text, setText] = useState('');
  const me = session?.user.id;

  const submit = async () => {
    const t = text.trim();
    if (!t || !me) return;
    setText('');
    await add(me, t);
  };

  const clr = useColors();
  return (
    <View className="mt-2 px-4">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-2">
        Comments{comments.length ? ` · ${comments.length}` : ''}
      </Text>

      {session ? (
        <View className="mb-5 flex-row items-center gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={clr.content2}
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-[15px] text-content"
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable
            onPress={submit}
            disabled={!text.trim() || adding}
            className="rounded-full px-4 py-2.5 active:opacity-80"
            style={{ backgroundColor: text.trim() ? ACCENT : clr.content2 }}>
            <Text className="font-semibold text-white">Post</Text>
          </Pressable>
        </View>
      ) : (
        <Text className="mb-5 text-sm text-content-2">Sign in to comment.</Text>
      )}

      {isLoading ? (
        <ActivityIndicator color={ACCENT} style={{ marginVertical: 12 }} />
      ) : comments.length === 0 ? (
        <Text className="py-2 text-sm text-content-2">No comments yet.</Text>
      ) : (
        comments.map((c) => {
          const a = c.author;
          const name = a?.display_name || a?.username || 'Someone';
          return (
            <View key={c.id} className="mb-4 flex-row gap-2.5">
              {a?.avatar_url ? (
                <Image source={{ uri: a.avatar_url }} style={{ width: 34, height: 34, borderRadius: 17 }} />
              ) : (
                <Avatar seed={a?.avatar_seed || a?.username || c.user_id} size={34} />
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-semibold text-content" numberOfLines={1}>{name}</Text>
                  <Text className="flex-shrink text-xs text-content-2" numberOfLines={1}>
                    @{a?.username ?? 'user'} · {timeAgo(c.created_at)}
                  </Text>
                </View>
                <Text className="text-[15px] leading-5 text-content">{c.text}</Text>
              </View>
              {me === c.user_id ? (
                <Pressable onPress={() => remove(c.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={clr.content2} />
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
