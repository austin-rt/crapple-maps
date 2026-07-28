import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveFollow,
  fetchFollowing,
  fetchFollowRequestRows,
  follow as dbFollow,
  unfollow as dbUnfollow,
  type FollowStatus,
} from '@/lib/db/follows';
import { profilesByIds } from '@/lib/db/profiles';
import { toast } from '@/lib/toast';
import type { Profile } from '@/lib/types';

export function useFollows(me: string | undefined) {
  const qc = useQueryClient();

  const requestsQ = useQuery({
    queryKey: ['follow-requests', me],
    enabled: !!me,
    queryFn: async (): Promise<{ followId: string; prof: Profile }[]> => {
      const rows = await fetchFollowRequestRows(me!);
      const profs = await profilesByIds(rows.map((r: any) => r.follower_id));
      return rows
        .map((r: any) => ({ followId: r.id as string, prof: profs[r.follower_id] }))
        .filter((x): x is { followId: string; prof: Profile } => !!x.prof);
    },
  });

  const followingQ = useQuery({
    queryKey: ['my-following', me],
    enabled: !!me,
    queryFn: () => fetchFollowing(me!),
  });

  const statusFor = (id: string): FollowStatus | undefined =>
    followingQ.data?.find((f) => f.followee_id === id)?.status;

  const follow = async (id: string) => {
    try {
      await dbFollow(me!, id);
      qc.invalidateQueries({ queryKey: ['my-following'] });
      toast.success('Request sent');
    } catch (e: any) {
      toast.error("Couldn't follow", e?.message);
    }
  };
  const unfollow = async (id: string) => {
    try {
      await dbUnfollow(me!, id);
      qc.invalidateQueries({ queryKey: ['my-following'] });
      toast.success('Unfollowed');
    } catch (e: any) {
      toast.error("Couldn't unfollow", e?.message);
    }
  };
  const approve = async (followId: string) => {
    try {
      await approveFollow(followId);
      qc.invalidateQueries({ queryKey: ['follow-requests'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Approved');
    } catch (e: any) {
      toast.error("Couldn't approve", e?.message);
    }
  };

  return { requests: requestsQ.data ?? [], statusFor, follow, unfollow, approve };
}
