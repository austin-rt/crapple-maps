// Renders a user's 1200x630 PNG "profile card" and stores it at
// profile-cards/<user_id>.png. It is the og:image for their
// crapplemaps.com/u/<username> invite link, so Messages, Slack and the like
// preview the link as a card with the person's avatar.
//
// Rendering happens only when the card would change: a database trigger
// (migration 0010) posts { user_id } after a profile's photo, avatar seed,
// display name or username changes. Backfill by posting each user_id in turn;
// rendering many cards in one invocation exceeds the worker's compute limit.
// Link views read the stored PNG and never reach this function.
//
// Deploy:  supabase functions deploy profile-card --no-verify-jwt
//          (index.ts imports this file)
// Secret:  supabase secrets set CARD_SECRET=... and the same value in Vault as
//          profile_card_secret

import React from 'https://esm.sh/react@18.2.0';
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.6/mod.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ACCENT = '#0E7490';
const BUCKET = 'profile-cards';
const CARD_SECRET = Deno.env.get('CARD_SECRET');
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
};

let fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: 'normal' }[] | null = null;
async function loadFonts() {
  if (fonts) return fonts;
  const get = (w: number) =>
    fetch(`https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-${w}-normal.woff`).then((r) => r.arrayBuffer());
  const [r, b, x] = await Promise.all([get(400), get(700), get(800)]);
  fonts = [
    { name: 'Inter', data: r, weight: 400, style: 'normal' },
    { name: 'Inter', data: b, weight: 700, style: 'normal' },
    { name: 'Inter', data: x, weight: 800, style: 'normal' },
  ];
  return fonts;
}

// Port of components/ui/Avatar.tsx so the card shows the same seeded avatar
// the app draws. Keep the two in step if the avatar art changes.
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length)];
const hexRgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
const rgbHex = (c: number[]) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const shade = (h: string, f: number) => rgbHex(hexRgb(h).map((x) => x * f));
const tint = (h: string, f: number) => rgbHex(hexRgb(h).map((x) => x + (255 - x) * f));

const SKIN = ['#F8D2BC', '#F0C0A0', '#E0A878', '#C68A56', '#9E6B43', '#6E4A2E'];
const HAIR = ['#221A16', '#3B2A1E', '#5C3A22', '#8A5A2B', '#C08442', '#E3BE79', '#141821', '#6D28D9'];
const SHIRT = ['#7C3AED', '#4F46E5', '#0EA5E9', '#0D9488', '#F59E0B', '#EF4444', '#DB2777', '#334155'];
const BG = ['#EADCF9', '#D8E8FB', '#D6F2E2', '#FCEFC7', '#FBDCEC', '#E4E7EB', '#EFE7FB', '#CFF3EC'];
const CAP_FULL = 'M31 45 C30 27 41 23 50 23 C59 23 70 27 69 45 C65 35 58 32 50 32 C42 32 35 35 31 45 Z';
const CAP_BUZZ = 'M33 42 C33 31 41 28 50 28 C59 28 67 31 67 42 C64 36 58 34 50 34 C42 34 36 36 33 42 Z';
const BACK: Record<number, string> = {
  2: 'M23 40 C14 60 17 86 24 100 L41 100 C34 82 33 58 45 47 C57 58 66 82 59 100 L76 100 C83 86 86 60 77 40 C77 24 64 19 50 19 C36 19 23 24 23 40 Z',
  6: 'M26 42 C21 55 23 69 31 76 C33 66 35 57 45 49 C55 57 67 66 69 76 C77 69 79 55 74 42 C74 27 63 21 50 21 C37 21 26 27 26 42 Z',
  7: 'M64 29 C86 33 93 60 82 88 C80 68 73 51 58 44 C62 38 64 32 64 29 Z',
  8: 'M22 41 C15 58 19 80 14 100 L39 100 C35 83 34 58 45 47 C57 58 64 80 61 100 L87 100 C83 80 86 58 78 41 C78 25 64 20 50 20 C36 20 22 25 22 41 Z',
};

function SeedAvatar({ seed, size }: { seed: string; size: number }) {
  const r = mulberry32(hashStr(seed || 'user'));
  const skin = pick(SKIN, r());
  const hair = pick(HAIR, r());
  const shirt = pick(SHIRT, r());
  const bg = pick(BG, r());
  const style = Math.floor(r() * 9);
  const skinSh = shade(skin, 0.9);
  const hairSh = shade(hair, 0.85);
  const hairHi = tint(hair, 0.28);
  const shirtSh = shade(shirt, 0.82);
  const shirtHi = tint(shirt, 0.18);
  const back = BACK[style];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill={bg} />
      <ellipse cx="36" cy="30" rx="42" ry="34" fill="#ffffff" opacity="0.1" />
      {back ? <path d={back} fill={hairSh} /> : null}
      {style === 1 ? <circle cx="50" cy="39" r="22" fill={hair} /> : null}
      <path d="M13 100 C13 71 31 63 50 63 C69 63 87 71 87 100 Z" fill={shirt} />
      <path d="M13 100 C13 78 26 69 40 65 C34 76 33 88 35 100 Z" fill={shirtHi} opacity="0.35" />
      <path d="M44 64 C46 71 54 71 56 64 C54 68 46 68 44 64 Z" fill={shirtSh} />
      <rect x="44" y="51" width="12" height="17" rx="5" fill={skin} />
      <ellipse cx="50" cy="55" rx="13" ry="6" fill={skinSh} opacity="0.55" />
      <circle cx="32" cy="44" r="4.6" fill={skin} />
      <circle cx="68" cy="44" r="4.6" fill={skin} />
      <circle cx="32" cy="44" r="2" fill={skinSh} opacity="0.6" />
      <circle cx="68" cy="44" r="2" fill={skinSh} opacity="0.6" />
      <circle cx="50" cy="43" r="17.5" fill={skin} />
      <path d="M50 25.5 A17.5 17.5 0 0 1 50 60.5 A13 17 0 0 0 50 25.5 Z" fill={skinSh} opacity="0.35" />
      <ellipse cx="41" cy="49" rx="3.2" ry="2.2" fill="#F59AA0" opacity="0.4" />
      <ellipse cx="59" cy="49" rx="3.2" ry="2.2" fill="#F59AA0" opacity="0.4" />
      <ellipse cx="43" cy="43.6" rx="1.7" ry="2.3" fill="#2b2320" />
      <ellipse cx="57" cy="43.6" rx="1.7" ry="2.3" fill="#2b2320" />
      <circle cx="43.6" cy="42.9" r="0.5" fill="#ffffff" opacity="0.85" />
      <circle cx="57.6" cy="42.9" r="0.5" fill="#ffffff" opacity="0.85" />
      <path d="M40 39 Q43 37.7 46 39" stroke={hairSh} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M54 39 Q57 37.7 60 39" stroke={hairSh} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M50 45 L50 49" stroke={skinSh} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M46 52.5 Q50 55.5 54 52.5" stroke={shade(skin, 0.55)} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {style !== 5 ? <path d={style === 4 ? CAP_BUZZ : CAP_FULL} fill={hair} /> : null}
      {style !== 5 ? <path d="M34 40 C37 30 45 27 52 28 C46 29 40 33 37 41 Z" fill={hairHi} opacity="0.55" /> : null}
      {style === 3 ? <circle cx="50" cy="19" r="8" fill={hair} /> : null}
      {style === 7 ? <circle cx="62" cy="31" r="3.6" fill={hairSh} /> : null}
    </svg>
  );
}

function Pin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#ffffff" />
    </svg>
  );
}

function Card({ p }: { p: Profile }) {
  const name = p.display_name || p.username;
  const AV = 300;
  return (
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', fontFamily: 'Inter', background: `linear-gradient(135deg, ${ACCENT} 0%, #0B3B4A 100%)`, padding: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Pin size={44} />
        <div style={{ color: '#ffffff', fontSize: 40, fontWeight: 800 }}>Crapple Maps</div>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 56 }}>
        <div style={{ display: 'flex', width: AV + 16, height: AV + 16, borderRadius: (AV + 16) / 2, background: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
          {p.avatar_url ? (
            <img src={p.avatar_url} width={AV} height={AV} style={{ borderRadius: AV / 2, objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', width: AV, height: AV, borderRadius: AV / 2, overflow: 'hidden' }}>
              <SeedAvatar seed={p.avatar_seed || p.username} size={AV} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ color: '#ffffff', fontSize: name.length > 16 ? 60 : 76, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ color: '#CFF3EC', fontSize: 36, marginTop: 10 }}>{`@${p.username}`}</div>
          <div style={{ display: 'flex', marginTop: 40 }}>
            <div style={{ display: 'flex', background: '#ffffff', color: ACCENT, fontSize: 32, fontWeight: 700, padding: '16px 34px', borderRadius: 999 }}>
              Follow me on Crapple Maps
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLUMNS = 'id,username,display_name,avatar_url,avatar_seed';

async function renderAndStore(p: Profile) {
  const png = await new ImageResponse(<Card p={p} />, { width: 1200, height: 630, fonts: await loadFonts() }).arrayBuffer();
  const { error } = await db.storage
    .from(BUCKET)
    .upload(`${p.id}.png`, png, { contentType: 'image/png', cacheControl: '300', upsert: true });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' || !CARD_SECRET || req.headers.get('x-card-secret') !== CARD_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (typeof body.user_id !== 'string') return new Response('user_id required', { status: 400 });
  const { data, error } = await db.from('profiles').select(COLUMNS).eq('id', body.user_id).maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  if (!data) return new Response('not found', { status: 404 });
  try {
    await renderAndStore(data as Profile);
  } catch (e) {
    console.error('card failed', body.user_id, e);
    return new Response('render failed', { status: 500 });
  }
  return Response.json({ rendered: body.user_id });
});
