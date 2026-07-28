import { supabase } from '@/lib/supabase';
import type { Author } from '@/lib/types';

export type Comment = { id: string; user_id: string; text: string; created_at: string; author: Author | null };

const COMMENT_WITH_AUTHOR = 'id,user_id,text,created_at, author:profiles(username,display_name,avatar_url,avatar_seed)';

export async function fetchComments(logId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_WITH_AUTHOR)
    .eq('log_id', logId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function addComment(logId: string, userId: string, text: string): Promise<void> {
  const { error } = await supabase.from('comments').insert({ log_id: logId, user_id: userId, text });
  if (error) throw error;
}

// Soft-delete (RLS allows the author to update their own row; there's no delete policy).
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
