import { useQueryClient } from '@tanstack/react-query';
import { Text } from 'react-native';

import { Segmented } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/lib/db/profiles';
import { toast } from '@/lib/toast';
import type { Visibility } from '@/lib/types';
import { VIS_HINT, VIS_OPTIONS } from '@/lib/visibility';

import { Card } from './Card';

// Account-wide default for who sees new posts. Each post can still be changed
// on Drop a log before it's saved.
export function PostVisibilityCard({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data: profile } = useProfile(uid);
  const current: Visibility = (profile?.default_visibility as Visibility | undefined) ?? 'friends';

  const choose = async (v: Visibility) => {
    if (v === current) return;
    try {
      await updateProfile(uid, { default_visibility: v });
      qc.invalidateQueries({ queryKey: ['profile', uid] });
    } catch (e: any) {
      toast.error("Couldn't save", e?.message);
    }
  };

  return (
    <Card title="Who sees your posts">
      <Segmented options={VIS_OPTIONS} value={current} onChange={choose} />
      <Text className="mt-2 text-xs text-content-2">{VIS_HINT[current]} New posts start here; you can change any single post.</Text>
    </Card>
  );
}
