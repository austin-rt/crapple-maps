import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { fetchSavedIds, fetchSavedRestrooms, isSaved, setSaved } from '@/lib/db/saved';

// Set of saved restroom ids for the current user (list membership checks).
export function useSavedIds(userId: string | undefined) {
  return useQuery({ queryKey: ['saved-ids', userId], enabled: !!userId, queryFn: () => fetchSavedIds(userId!) });
}

// Saved restrooms joined to their rows (Saved list screen).
export function useSavedList(userId: string | undefined) {
  return useQuery({ queryKey: ['saved-list', userId], enabled: !!userId, queryFn: () => fetchSavedRestrooms(userId!) });
}

// Save-state + toggle for a single restroom (sheet action row).
export function useSavedRestroom(restroomId: string) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();

  const { data: saved = false } = useQuery({
    queryKey: ['saved', uid, restroomId],
    enabled: !!uid,
    queryFn: () => isSaved(uid!, restroomId),
  });

  const toggle = async () => {
    if (!uid) return;
    await setSaved(uid, restroomId, !saved);
    qc.invalidateQueries({ queryKey: ['saved', uid, restroomId] });
    qc.invalidateQueries({ queryKey: ['saved-ids', uid] });
    qc.invalidateQueries({ queryKey: ['saved-list', uid] });
  };

  return { saved, toggle, canSave: !!uid };
}
