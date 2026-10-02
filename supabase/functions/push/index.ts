// Delivers one notification row as an Expo push to every device the recipient
// is signed in on. Called by the notifications_push trigger (migration 0030)
// with the shared PUSH_SECRET; deployed with --no-verify-jwt for that reason.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SECRET = Deno.env.get('PUSH_SECRET');
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const ACTION: Record<string, string> = {
  follow: 'started following you',
  follow_request: 'wants to follow you',
  follow_accepted: 'accepted your follow request',
  like: 'liked your post',
  comment: 'commented on your post',
};

Deno.serve(async (req) => {
  if (!SECRET || req.headers.get('x-push-secret') !== SECRET) return new Response('forbidden', { status: 403 });
  const { notification_id } = await req.json();

  const { data: n } = await db
    .from('notifications')
    .select('kind, recipient_id, log_id, actor:profiles!notifications_actor_id_fkey(username, display_name)')
    .eq('id', notification_id)
    .maybeSingle();
  if (!n) return Response.json({ sent: 0 });

  const { data: tokens } = await db.from('push_tokens').select('token').eq('user_id', n.recipient_id);
  if (!tokens?.length) return Response.json({ sent: 0 });

  const { count: unread } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', n.recipient_id)
    .is('read_at', null);

  const actor = n.actor as { username: string; display_name: string | null } | null;
  const name = actor?.display_name || (actor?.username ? `@${actor.username}` : 'Someone');
  const url = n.log_id && (n.kind === 'like' || n.kind === 'comment') ? `/log/${n.log_id}` : '/notifications';
  const messages = tokens.map(({ token }) => ({
    to: token,
    body: `${name} ${ACTION[n.kind] ?? 'sent you a notification'}`,
    sound: 'default',
    badge: unread ?? undefined,
    data: { url },
  }));

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const out = await res.json();

  // Tokens Expo reports as no longer registered belong to uninstalled apps.
  const dead = ((out?.data ?? []) as { status: string; details?: { error?: string } }[])
    .map((t, i) => (t.status === 'error' && t.details?.error === 'DeviceNotRegistered' ? messages[i].to : null))
    .filter((t): t is string => !!t);
  if (dead.length) await db.from('push_tokens').delete().in('token', dead);

  return Response.json({ sent: messages.length, dead: dead.length });
});
