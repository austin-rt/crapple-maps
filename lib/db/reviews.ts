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
