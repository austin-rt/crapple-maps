import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { blockUser, fetchBlockedIds, unblockUser } from '@/lib/db/moderation';

// Blocked-user ids for the signed-in user; content queries filter against it.
export function useBlockedIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['blocked', userId],
    enabled: !!userId,
    queryFn: () => fetchBlockedIds(userId!),
  });
}

export function useBlock(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['blocked', userId] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['comments'] });
  };
  const block = useMutation({ mutationFn: blockUser, onSettled: invalidate });
  const unblock = useMutation({ mutationFn: unblockUser, onSettled: invalidate });
  return { block: block.mutateAsync, unblock: unblock.mutateAsync };
}
