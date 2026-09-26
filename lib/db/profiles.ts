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
    .select('username, username_chosen, display_name, avatar_url, avatar_seed, followers_count, following_count, logs_count')
    .eq('id', id)
    .single();
  return data;
}


export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

export async function updateAvatarSeed(id: string, seed: string) {
  const { error } = await supabase.from('profiles').update({ avatar_seed: seed, avatar_url: null }).eq('id', id);
  if (error) throw error;
  await clearAvatarFiles(id).catch(() => {});
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

const AVATAR_BUCKET = 'avatars';

// Deletes every file in the user's avatars folder except `keep`, so only the
// current photo is ever stored (older uploads used timestamped names).
async function clearAvatarFiles(userId: string, keep?: string) {
  const { data } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await supabase.storage.from(AVATAR_BUCKET).remove(stale);
}

// Overwrites the user's single photo at <uid>/avatar.jpg. The stored URL gets
// a version query so the app, the CDN and link-preview cards pick up the new
// picture even though the file path never changes.
// `fetch(uri)` handles native file URIs AND web blob/data URLs.
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, arraybuffer, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  await updateProfile(userId, { avatar_url: url });
  await clearAvatarFiles(userId, path).catch(() => {});
  return url;
}

export type PublicProfile = Profile & { followers_count: number | null; following_count: number | null };

export async function fetchProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url,avatar_seed,followers_count,following_count')
    .eq('username', username)
    .maybeSingle();
  return (data as PublicProfile | null) ?? null;
}
