import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ACCENT, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Prof = { id: string; username: string; display_name: string | null; avatar_url: string | null; avatar_seed: string | null };

function Row({ p, right }: { p: Prof; right: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
      {p.avatar_url ? (
        <Image source={{ uri: p.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <Avatar seed={p.avatar_seed || p.username} size={44} />
      )}
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-content">{p.display_name || p.username}</Text>
        <Text className="text-sm text-content-2">@{p.username}</Text>
      </View>
      {right}
    </View>
  );
}

async function profilesByIds(ids: string[]): Promise<Record<string, Prof>> {
  if (!ids.length) return {};
  const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url,avatar_seed').in('id', ids);
  const out: Record<string, Prof> = {};
  for (const p of (data ?? []) as Prof[]) out[p.id] = p;
  return out;
}

export default function People() {
  const { session } = useAuth();
  const me = session?.user.id;
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // people who requested to follow me (pending)
  const { data: requests = [] } = useQuery({
    queryKey: ['follow-requests', me],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from('follows').select('id,follower_id').eq('followee_id', me).eq('status', 'pending');
      const rows = data ?? [];
      const profs = await profilesByIds(rows.map((r: any) => r.follower_id));
      return rows.map((r: any) => ({ followId: r.id, prof: profs[r.follower_id] })).filter((x: any) => x.prof);
    },
  });

  // my outgoing follows → button state
  const { data: following = [] } = useQuery({
    queryKey: ['my-following', me],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from('follows').select('followee_id,status').eq('follower_id', me);
      return data ?? [];
    },
  });

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['user-search', debounced, me],
    enabled: debounced.length >= 2,
    queryFn: async (): Promise<Prof[]> => {
      const { data } = await supabase
        .from('profiles')
        .select('id,username,display_name,avatar_url,avatar_seed')
        .ilike('username', `%${debounced}%`)
        .neq('id', me!)
        .limit(20);
      return (data ?? []) as Prof[];
    },
  });

  const stateFor = (id: string) => (following as any[]).find((f) => f.followee_id === id)?.status as 'pending' | 'approved' | undefined;

  const follow = async (id: string) => {
    await supabase.from('follows').insert({ follower_id: me, followee_id: id, status: 'pending' });
    qc.invalidateQueries({ queryKey: ['my-following'] });
  };
  const unfollow = async (id: string) => {
    await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', id);
    qc.invalidateQueries({ queryKey: ['my-following'] });
  };
  const approve = async (followId: string) => {
    await supabase.from('follows').update({ status: 'approved' }).eq('id', followId);
    qc.invalidateQueries({ queryKey: ['follow-requests'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const FollowBtn = ({ id }: { id: string }) => {
    const st = stateFor(id);
    const label = st === 'approved' ? 'Following' : st === 'pending' ? 'Requested' : 'Follow';
    const filled = !st;
    return (
      <Pressable
        onPress={() => (st ? unfollow(id) : follow(id))}
        className={`rounded-full px-4 py-1.5 ${filled ? '' : 'border border-line'}`}
        style={filled ? { backgroundColor: ACCENT } : undefined}>
        <Text className={filled ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-content'}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1 bg-surface" keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Find people' }} />

      <View className="px-4 pt-3">
        <View className="flex-row items-center rounded-2xl border border-line px-3">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search by username…"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={setQ}
            autoCapitalize="none"
            className="flex-1 px-2 py-3 text-base text-content"
          />
          {isFetching ? <ActivityIndicator size="small" color="#9CA3AF" /> : null}
        </View>
      </View>

      {requests.length > 0 ? (
        <View className="mt-4">
          <Text className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-content-2">Follow requests</Text>
          {(requests as any[]).map(({ followId, prof }) => (
            <Row
              key={followId}
              p={prof}
              right={
                <Pressable onPress={() => approve(followId)} className="rounded-full px-4 py-1.5" style={{ backgroundColor: ACCENT }}>
                  <Text className="text-sm font-semibold text-white">Approve</Text>
                </Pressable>
              }
            />
          ))}
        </View>
      ) : null}

      {debounced.length >= 2 ? (
        <View className="mt-4">
          <Text className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-content-2">Results</Text>
          {results.length === 0 && !isFetching ? (
            <Text className="px-4 py-6 text-center text-sm text-content-2">No one found for “{debounced}”.</Text>
          ) : (
            results.map((p) => <Row key={p.id} p={p} right={<FollowBtn id={p.id} />} />)
          )}
        </View>
      ) : (
        <Text className="mt-10 px-8 text-center text-sm text-content-2">
          Search for friends by their @username to follow them and see their posts.
        </Text>
      )}
    </ScrollView>
  );
}
