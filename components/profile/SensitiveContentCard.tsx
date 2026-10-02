import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { CheckRow } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/lib/db/profiles';
import { toast } from '@/lib/toast';

import { Card } from './Card';

export function SensitiveContentCard({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data: profile } = useProfile(uid);

  const save = async (patch: { mark_sensitive?: boolean; show_sensitive?: boolean }) => {
    try {
      await updateProfile(uid, patch);
      qc.invalidateQueries({ queryKey: ['profile', uid] });
    } catch (e: any) {
      toast.error("Couldn't save", e?.message);
    }
  };

  return (
    <Card title="Sensitive content">
      <View className="gap-4">
        <CheckRow
          checked={!!profile?.mark_sensitive}
          onToggle={() => save({ mark_sensitive: !profile?.mark_sensitive })}
          title="Mark my photos sensitive"
          hint="New posts start with Sensitive content ticked"
        />
        <CheckRow
          checked={!!profile?.show_sensitive}
          onToggle={() => save({ show_sensitive: !profile?.show_sensitive })}
          title="Show sensitive photos"
          hint="See flagged photos without the blur"
        />
      </View>
    </Card>
  );
}
