import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/types';

export async function fetchReviews(restroomId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('id,overall_rating,description,created_at')
    .eq('restroom_id', restroomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function addReview(input: {
  restroomId: string;
  userId: string;
  rating: number | null;
  description: string | null;
}) {
  const { error } = await supabase.from('reviews').insert({
    restroom_id: input.restroomId,
    user_id: input.userId,
    overall_rating: input.rating,
    description: input.description,
  });
  if (error) throw error;
}


export type TpTally = { tp_quality: number; reports: number };

export async function fetchTpSummary(restroomId: string): Promise<TpTally[]> {
  const { data } = await supabase.rpc('restroom_tp_summary', { p_restroom_id: restroomId });
  return ((data ?? []) as TpTally[]).map((r) => ({ tp_quality: r.tp_quality, reports: Number(r.reports) }));
}
