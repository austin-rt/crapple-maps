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

// One side of my follow graph, newest first. Followers are approved only
// (pending requests live in People); Following includes my pending requests so
// they can be cancelled from the list.
export async function fetchFollowEdges(
  me: string,
  side: 'followers' | 'following',
): Promise<{ userId: string; status: FollowStatus; createdAt: string }[]> {
  const q =
    side === 'followers'
      ? supabase.from('follows').select('follower_id,status,created_at').eq('followee_id', me).eq('status', 'approved')
      : supabase.from('follows').select('followee_id,status,created_at').eq('follower_id', me);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    userId: side === 'followers' ? r.follower_id : r.followee_id,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function removeFollower(me: string, id: string) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', id).eq('followee_id', me);
  if (error) throw error;
}
