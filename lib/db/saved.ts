import { supabase } from '@/lib/supabase';

// All restroom ids this user has saved — one query, for set-membership checks
// in lists (avoids an N+1 per card).
export async function fetchSavedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('saved_restrooms').select('restroom_id').eq('user_id', userId);
  return new Set((data ?? []).map((r: any) => r.restroom_id as string));
}

export async function isSaved(userId: string, restroomId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_restrooms')
    .select('restroom_id')
    .eq('user_id', userId)
    .eq('restroom_id', restroomId)
    .maybeSingle();
  return !!data;
}

export async function setSaved(userId: string, restroomId: string, on: boolean) {
  if (on) {
    const { error } = await supabase.from('saved_restrooms').insert({ user_id: userId, restroom_id: restroomId });
    if (error && error.code !== '23505') throw error; // ignore duplicate
  } else {
    const { error } = await supabase.from('saved_restrooms').delete().eq('user_id', userId).eq('restroom_id', restroomId);
    if (error) throw error;
  }
}

// Saved restrooms joined to their restroom rows (for the Saved list screen).
export async function fetchSavedRestrooms(userId: string) {
  const { data } = await supabase
    .from('saved_restrooms')
    .select('restroom_id, created_at, restrooms(id,name,lat,lng,address,access_type,accessible,unisex,changing_table,requires_code,purchase_required)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? [])
    .map((r: any) => (r.restrooms ? { ...r.restrooms, dist: null } : null))
    .filter(Boolean);
}
