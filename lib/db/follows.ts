import { supabase } from '@/lib/supabase';

export type FollowStatus = 'pending' | 'approved';

// Incoming follow requests to `me` (pending) — returns raw {id, follower_id}.
export async function fetchFollowRequestRows(me: string) {
  const { data } = await supabase.from('follows').select('id,follower_id').eq('followee_id', me).eq('status', 'pending');
  return data ?? [];
}

// My outgoing follows (for button state).
export async function fetchFollowing(me: string): Promise<{ followee_id: string; status: FollowStatus }[]> {
  const { data } = await supabase.from('follows').select('followee_id,status').eq('follower_id', me);
  return (data ?? []) as { followee_id: string; status: FollowStatus }[];
}

export async function follow(me: string, id: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: me, followee_id: id, status: 'pending' });
  if (error) throw error;
}

export async function unfollow(me: string, id: string) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', id);
  if (error) throw error;
}

export async function approveFollow(followId: string) {
  const { error } = await supabase.from('follows').update({ status: 'approved' }).eq('id', followId);
  if (error) throw error;
}
