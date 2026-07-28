import { supabase } from '@/lib/supabase';
import type { Code } from '@/lib/types';

export async function fetchCodes(restroomId: string): Promise<Code[]> {
  const { data } = await supabase
    .from('codes')
    .select('id,code,posted_at')
    .eq('restroom_id', restroomId)
    .order('posted_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

export async function addCodes(restroomId: string, codes: string[], userId: string) {
  if (!codes.length) return;
  const { error } = await supabase
    .from('codes')
    .insert(codes.map((code) => ({ restroom_id: restroomId, code, posted_by: userId })));
  if (error) throw error;
}

export async function deleteCodes(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from('codes').delete().in('id', ids);
  if (error) throw error;
}
