import { Alert, Platform } from 'react-native';

import { reportContent, type ReportTarget } from '@/lib/db/moderation';
import { toast } from '@/lib/toast';

// Cross-platform report/block menu for a piece of user content. Native gets a
// proper action sheet via Alert's button list; web falls back to sequential
// confirms (review happens on iOS — web just needs the capability to exist).
export function moderationMenu({
  targetType,
  targetId,
  authorName,
  onBlock,
}: {
  targetType: ReportTarget;
  targetId: string;
  authorName: string;
  onBlock: () => Promise<unknown>;
}) {
  const doReport = async () => {
    try {
      await reportContent(targetType, targetId, 'inappropriate');
      toast.success('Reported', "Thanks — we'll review this within 24 hours.");
    } catch (e: any) {
      toast.error("Couldn't report", e?.message);
    }
  };
  const doBlock = async () => {
    try {
      await onBlock();
      toast.success(`Blocked ${authorName}`, "You won't see their posts or comments.");
    } catch (e: any) {
      toast.error("Couldn't block", e?.message);
    }
  };

  if (Platform.OS === 'web') {
    if (window.confirm(`Report this ${targetType === 'log' ? 'post' : targetType}?`)) return void doReport();
    if (window.confirm(`Block ${authorName}? You won't see their posts or comments.`)) return void doBlock();
    return;
  }
  Alert.alert('Options', undefined, [
    { text: `Report ${targetType === 'log' ? 'post' : targetType}`, onPress: doReport },
    { text: `Block ${authorName}`, style: 'destructive', onPress: doBlock },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
