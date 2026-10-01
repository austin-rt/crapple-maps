import { useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/lib/db/profiles';
import { useColors } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { ACCENT, ON_ACCENT } from '@/lib/tokens';
import type { Visibility } from '@/lib/types';
import { VISIBILITIES, VIS_HINT, VIS_ICON, VIS_LABEL } from '@/lib/visibility';

import { Card } from './Card';

// Account-wide default for who sees new posts. Each post can still be changed
// on Drop a log before it's saved.
export function PostVisibilityCard({ uid }: { uid: string }) {
  const c = useColors();
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
      <View className="flex-row gap-2">
        {VISIBILITIES.map((v) => {
          const on = current === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => choose(v)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${on ? 'border-transparent' : 'border-line'}`}
              style={on ? { backgroundColor: ACCENT } : undefined}>
              <Icon name={VIS_ICON[v]} size={16} color={on ? ON_ACCENT : c.content2} />
              <Text className={on ? 'font-semibold text-white' : 'text-content-2'}>{VIS_LABEL[v]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2 text-xs text-content-2">{VIS_HINT[current]} New posts start here; you can change any single post.</Text>
    </Card>
  );
}
