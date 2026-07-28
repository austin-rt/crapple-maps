import { fetchLogPhotos } from '@/lib/photos';
import { supabase } from '@/lib/supabase';
import type { FeedLog, LogItem, Visibility } from '@/lib/types';

// Shared select for a log joined with its author profile + like/comment counts
// (feed + single log). reactions(count)/comments(count) are PostgREST aggregates.
const LOG_WITH_AUTHOR =
  'id,user_id,lat,lng,rating,bristol_type,caption,visibility,created_at, author:profiles(username,display_name,avatar_url,avatar_seed), reactions(count), comments(count)';

// Flatten the [{count}] aggregate arrays into plain numbers.
const withCounts = <T extends Record<string, any>>(rows: T[]): (T & { likes_count: number; comments_count: number })[] =>
  rows.map((r) => ({
    ...r,
    likes_count: Array.isArray(r.reactions) ? (r.reactions[0]?.count ?? 0) : 0,
    comments_count: Array.isArray(r.comments) ? (r.comments[0]?.count ?? 0) : 0,
  }));

const withPhotos = async <T extends { id: string }>(rows: T[]): Promise<(T & { photos: string[] })[]> => {
  const photos = await fetchLogPhotos(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, photos: photos[r.id] ?? [] }));
};

export async function fetchFeed(offset: number, limit: number): Promise<FeedLog[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_WITH_AUTHOR)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return withPhotos(withCounts((data ?? []) as any[])) as Promise<FeedLog[]>;
}

export async function fetchLog(id: string): Promise<FeedLog | null> {
  const { data, error } = await supabase.from('logs').select(LOG_WITH_AUTHOR).eq('id', id).single();
  if (error) throw error;
  if (!data) return null;
  return (await withPhotos(withCounts([data as any])))[0] as FeedLog;
}

export async function fetchMyLogs(userId: string): Promise<LogItem[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('id,lat,lng,rating,bristol_type,caption,visibility,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return withPhotos((data ?? []) as any[]) as Promise<LogItem[]>;
}

// Visits by this user at a specific restroom (restroom sheet).
export async function fetchVisits(restroomId: string, userId: string) {
  const { data } = await supabase
    .from('logs')
    .select('id,created_at,caption')
    .eq('restroom_id', restroomId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

export type NewLog = {
  userId: string;
  lat: number;
  lng: number;
  restroomId: string | null;
  rating: number | null;
  bristolType: number | null;
  caption: string | null;
  visibility: Visibility;
};

export async function createLog(input: NewLog): Promise<string> {
  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: input.userId,
      lat: input.lat,
      lng: input.lng,
      restroom_id: input.restroomId,
      rating: input.rating,
      bristol_type: input.bristolType,
      caption: input.caption,
      visibility: input.visibility,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function softDeleteLog(id: string) {
  const { error } = await supabase.from('logs').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// Restroom ids the user has logged a visit at — for a distinct "visited" marker.
export async function fetchLoggedRestroomIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('logs')
    .select('restroom_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('restroom_id', 'is', null);
  return new Set((data ?? []).map((r: any) => r.restroom_id as string));
}
