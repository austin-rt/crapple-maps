import { supabase } from '@/lib/supabase';

// What a like is on: a post or a comment.
export type LikeTarget = { logId: string; commentId?: never } | { commentId: string; logId?: never };

// A post like is a reaction of type 'like' (the reactions table is one row per
// user per log, type changeable; only 'like' is used). Comment likes live in
// comment_likes.
const LIKE = 'like';

function likesOn(t: LikeTarget) {
  return t.commentId
    ? { table: 'comment_likes', column: 'comment_id', id: t.commentId, extra: {} }
    : { table: 'reactions', column: 'log_id', id: t.logId!, extra: { type: LIKE } };
}

export async function fetchLikes(target: LikeTarget, userId: string | undefined): Promise<{ count: number; liked: boolean }> {
  const t = likesOn(target);
  let q = supabase.from(t.table).select('user_id').eq(t.column, t.id);
  if (t.table === 'reactions') q = q.eq('type', LIKE);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  return { count: rows.length, liked: !!userId && rows.some((r: any) => r.user_id === userId) };
}

export async function setLike(target: LikeTarget, userId: string, on: boolean) {
  const t = likesOn(target);
  if (on) {
    const { error } = await supabase
      .from(t.table)
      // comment_likes has no update policy: an existing like is left as is.
      .upsert({ [t.column]: t.id, user_id: userId, ...t.extra }, { onConflict: `${t.column},user_id`, ignoreDuplicates: !!target.commentId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from(t.table).delete().eq(t.column, t.id).eq('user_id', userId);
    if (error) throw error;
  }
}
