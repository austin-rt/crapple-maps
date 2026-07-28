import { supabase } from '@/lib/supabase';

// "Like" is a reaction of type 'like' (the reactions table is one-row-per-user
// per log, type changeable — we only use 'like' for now).
const LIKE = 'like';

export async function fetchLikes(logId: string, userId: string | undefined): Promise<{ count: number; liked: boolean }> {
  const { data, error } = await supabase.from('reactions').select('user_id').eq('log_id', logId).eq('type', LIKE);
  if (error) throw error;
  const rows = data ?? [];
  return { count: rows.length, liked: !!userId && rows.some((r: any) => r.user_id === userId) };
}

export async function setLike(logId: string, userId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from('reactions')
      .upsert({ log_id: logId, user_id: userId, type: LIKE }, { onConflict: 'log_id,user_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('reactions').delete().eq('log_id', logId).eq('user_id', userId);
    if (error) throw error;
  }
}
