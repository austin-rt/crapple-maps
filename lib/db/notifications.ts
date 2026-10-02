import { profilesByIds } from '@/lib/db/profiles';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export type NotificationKind = 'follow' | 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'comment_like';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor: Profile;
  logId: string | null;
  createdAt: string;
  unread: boolean;
};

export async function fetchNotifications(me: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,kind,actor_id,log_id,created_at,read_at')
    .eq('recipient_id', me)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  const rows = data ?? [];
  const profs = await profilesByIds([...new Set(rows.map((r) => r.actor_id as string))]);
  return rows
    .filter((r) => profs[r.actor_id])
    .map((r) => ({
      id: r.id,
      kind: r.kind as NotificationKind,
      actor: profs[r.actor_id],
      logId: r.log_id,
      createdAt: r.created_at,
      unread: !r.read_at,
    }));
}

export async function fetchUnreadCount(me: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', me)
    .is('read_at', null);
  return count ?? 0;
}

export async function markAllRead(me: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', me)
    .is('read_at', null);
  if (error) throw error;
}
