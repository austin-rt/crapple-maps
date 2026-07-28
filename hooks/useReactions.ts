import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchLikes, setLike } from '@/lib/db/reactions';

type LikeState = { count: number; liked: boolean };

export function useLikes(logId: string, userId: string | undefined) {
  const qc = useQueryClient();
  const key = ['likes', logId];
  const query = useQuery({ queryKey: key, queryFn: () => fetchLikes(logId, userId), enabled: !!logId });

  const toggle = useMutation({
    mutationFn: (on: boolean) => setLike(logId, userId!, on),
    // Optimistic: flip the heart + count immediately, roll back on error.
    onMutate: async (on: boolean) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<LikeState>(key);
      qc.setQueryData<LikeState>(key, (d) => (d ? { count: Math.max(0, d.count + (on ? 1 : -1)), liked: on } : d));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    count: query.data?.count ?? 0,
    liked: query.data?.liked ?? false,
    canLike: !!userId,
    toggle: () => toggle.mutate(!(query.data?.liked ?? false)),
  };
}
