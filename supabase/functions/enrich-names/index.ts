// Enrich restroom names, staying inside Google's free tier.
//
// Each run processes at most ENRICH_BATCH rows (default 150) that still need a
// name. 150/day ≈ 4,500/month, under the 5,000 free Nearby Search calls. For
// each row we try Places Nearby Search (nearest business, e.g. "H&M Atlantic
// Station"); if none, fall back to a Geocoding street address. Rows a human
// named (name_source='user') are never touched. `enriched_at` prevents
// re-spending on rows we've already handled.
//
// Deploy (at launch):  supabase functions deploy enrich-names --no-verify-jwt
// Secrets:             supabase secrets set GOOGLE_SERVER_KEY=... ENRICH_SECRET=...
// Invoke:              scheduled via cron.sql (passes x-cron-secret)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const BATCH = Number(Deno.env.get('ENRICH_BATCH') ?? '150');
const GKEY = Deno.env.get('GOOGLE_SERVER_KEY') ?? '';
const SECRET = Deno.env.get('ENRICH_SECRET') ?? '';

const GENERIC = /^(public\s+)?(restroom|toilet|toilets|wc|bathroom|public toilet)s?$/i;
const isGeneric = (n: string | null) => !n || GENERIC.test(n.trim());

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Nearest business/landmark name via Places API (New). displayName is a Pro
// field → Nearby Search Pro pricing ($32/1k, 5k free/month).
async function nearbyName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GKEY,
        'X-Goog-FieldMask': 'places.displayName',
      },
      body: JSON.stringify({
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 75 } },
      }),
    });
    const j = await res.json();
    return j.places?.[0]?.displayName?.text ?? null;
  } catch {
    return null;
  }
}

// Fallback: a street address via Geocoding ($5/1k, 10k free/month).
async function streetAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GKEY}`);
    const j = await r.json();
    const res = j.results?.[0];
    if (!res) return null;
    const c = (t: string) => res.address_components?.find((x: any) => x.types.includes(t))?.long_name;
    return [c('street_number'), c('route')].filter(Boolean).join(' ') || c('route') || (res.formatted_address ?? '').split(',')[0] || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (SECRET && req.headers.get('x-cron-secret') !== SECRET) return json({ error: 'unauthorized' }, 401);
  if (!GKEY) return json({ error: 'GOOGLE_SERVER_KEY not set' }, 500);

  const { data: rows, error } = await supabase
    .from('restrooms')
    .select('id,name,name_source,lat,lng')
    .is('enriched_at', null)
    .or('name_source.is.null,name_source.neq.user')
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let named = 0, addressed = 0, kept = 0, placesCalls = 0;
  const now = new Date().toISOString();

  for (const r of rows ?? []) {
    // Row already has a real (non-generic) name from the seed — keep it, just mark done.
    if (!isGeneric(r.name)) {
      await supabase.from('restrooms').update({ enriched_at: now, name_source: r.name_source ?? 'osm' }).eq('id', r.id);
      kept++;
      continue;
    }

    placesCalls++;
    const biz = await nearbyName(r.lat, r.lng);
    if (biz) {
      await supabase.from('restrooms').update({ name: biz, name_source: 'places', enriched_at: now }).eq('id', r.id);
      named++;
      continue;
    }
    const addr = await streetAddress(r.lat, r.lng);
    await supabase.from('restrooms').update({ name: addr, name_source: addr ? 'geocoded' : r.name_source, enriched_at: now }).eq('id', r.id);
    if (addr) addressed++;
  }

  return json({ processed: rows?.length ?? 0, named, addressed, kept, placesCalls });
});
