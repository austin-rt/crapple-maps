// Serves crapplemaps.com/u/<username> with that person's profile card in the
// link-preview tags, so Messages, Slack and the like show a card instead of the
// generic site preview. The page itself is the static app shell Expo exports
// for app/u/[username].tsx; only the <head> tags change here.
//
// The card PNG is pre-rendered into the profile-cards bucket by the
// profile-card Edge Function whenever the profile's photo, avatar, display name
// or username changes, so a link view never renders anything.

const fs = require('fs');
const path = require('path');

const SITE = 'https://crapplemaps.com';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SHELL = fs.readFileSync(path.join(process.cwd(), 'dist', 'u', '[username].html'), 'utf8');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setMeta(html, key, value) {
  const re = new RegExp(`(<meta\\s+(?:property|name)="${key}"\\s+content=")[^"]*(")`);
  return re.test(html)
    ? html.replace(re, `$1${esc(value)}$2`)
    : html.replace('</head>', `<meta property="${key}" content="${esc(value)}"/></head>`);
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

async function fetchProfile(username) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,avatar_url,avatar_seed&username=eq.${encodeURIComponent(username)}&limit=1`;
  const res = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

module.exports = async (req, res) => {
  const username = String(req.query.username || '').trim();
  let html = SHELL;
  const p = username ? await fetchProfile(username).catch(() => null) : null;

  if (p) {
    const name = p.display_name || p.username;
    const title = p.display_name ? `${p.display_name} (@${p.username}) on Crapple Maps` : `@${p.username} on Crapple Maps`;
    const description = `Follow ${name} on Crapple Maps to see where they go, and find public restrooms near you.`;
    const version = hash([p.avatar_url, p.avatar_seed, p.display_name, p.username].join('|'));
    const image = `${SUPABASE_URL}/storage/v1/object/public/profile-cards/${p.id}.png?v=${version}`;
    const url = `${SITE}/u/${encodeURIComponent(p.username)}`;

    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    html = setMeta(html, 'description', description);
    html = setMeta(html, 'og:title', title);
    html = setMeta(html, 'og:description', description);
    html = setMeta(html, 'og:url', url);
    html = setMeta(html, 'og:image', image);
    html = setMeta(html, 'og:image:width', '1200');
    html = setMeta(html, 'og:image:height', '630');
    html = setMeta(html, 'twitter:title', title);
    html = setMeta(html, 'twitter:description', description);
    html = setMeta(html, 'twitter:image', image);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
};
