import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export async function profilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  if (!ids.length) return {};
  const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url,avatar_seed').in('id', ids);
  const out: Record<string, Profile> = {};
  for (const p of (data ?? []) as Profile[]) out[p.id] = p;
  return out;
}

export async function searchProfiles(q: string, excludeId: string): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url,avatar_seed')
    .ilike('username', `%${q}%`)
    .neq('id', excludeId)
    .limit(20);
  return (data ?? []) as Profile[];
}

// Full self profile (stats included) for the profile screen.
export async function fetchProfile(id: string) {
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, avatar_seed, followers_count, following_count, logs_count, age_verified_at')
    .eq('id', id)
    .single();
  return data;
}

// Records the 13+ self-attestation. Only the fact of it — never the birthday,
// which we'd otherwise be storing for no reason.
export async function setAgeVerified(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ age_verified_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

export async function updateAvatarSeed(id: string, seed: string) {
  const { error } = await supabase.from('profiles').update({ avatar_seed: seed, avatar_url: null }).eq('id', id);
  if (error) throw error;
}

// Count of THIS user's own (non-deleted) logs. The prior inline query omitted the
// user_id filter, so it counted all logs the viewer could see.
export async function fetchLogCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  return count ?? 0;
}

// `fetch(uri)` handles native file URIs AND web blob/data URLs, so this works on all platforms.
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
  const path = `${userId}/avatar_${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, arraybuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}
