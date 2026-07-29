import { supabase } from '@/lib/supabase';

// Account deletion + UGC moderation (App Store 5.1.1 / 1.2). The reports and
// blocks tables ship with RLS: reports are insert-only for the reporter;
// blocks are fully owned by the blocker.

export type ReportTarget = 'log' | 'review' | 'photo' | 'comment' | 'user' | 'code';

// Both buckets namespace objects under `${userId}/`, so the user's files are
// enumerable without admin rights. Storage must be cleared through the Storage
// API — Postgres refuses direct deletes from storage.objects — so it happens
// here, before the row delete cascades everything else away.
async function purgeStorage(userId: string): Promise<void> {
  for (const bucket of ['avatars', 'log-photos'] as const) {
    const paths: string[] = [];
    const walk = async (prefix: string) => {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
      if (error || !data) return;
      for (const entry of data) {
        const full = prefix ? `${prefix}/${entry.name}` : entry.name;
        // A null id means it's a folder (log-photos nests as userId/logId/file).
        if (entry.id == null) await walk(full);
        else paths.push(full);
      }
    };
    await walk(userId);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
}

// Cascades through profiles → all owned content; anonymizes contributed
// restrooms/photos. Caller signs out afterwards.
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('Not signed in');
  // Best-effort: a storage hiccup must not block the account deletion itself.
  try {
    await purgeStorage(uid);
  } catch {}
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
}

export async function reportContent(target_type: ReportTarget, target_id: string, reason: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('Sign in to report content');
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, target_type, target_id, reason });
  if (error) throw error;
}

export async function blockUser(blocked_id: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('Sign in to block users');
  const { error } = await supabase.from('blocks').upsert(
    { blocker_id: uid, blocked_id },
    { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function unblockUser(blocked_id: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', blocked_id);
  if (error) throw error;
}

export async function fetchBlockedIds(uid: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', uid);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.blocked_id as string));
}
