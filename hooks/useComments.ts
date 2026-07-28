import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addComment, deleteComment, fetchComments } from '@/lib/db/comments';

export function useComments(logId: string) {
  const qc = useQueryClient();
  const key = ['comments', logId];
  const query = useQuery({ queryKey: key, queryFn: () => fetchComments(logId), enabled: !!logId });

  const add = useMutation({
    mutationFn: ({ userId, text }: { userId: string; text: string }) => addComment(logId, userId, text),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    add: (userId: string, text: string) => add.mutateAsync({ userId, text }),
    remove: (id: string) => remove.mutate(id),
    adding: add.isPending,
  };
}
