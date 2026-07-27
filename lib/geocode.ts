// Reverse-geocode coordinates to a human label via the Google Geocoding API
// (Maps SDK key, Geocoding API enabled). Reliable + high QPS, unlike Nominatim's
// public server. Results are cached + de-duped in-memory.

export type Place = { title: string; full: string };

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY;
const cache = new Map<string, Place | null>();
const inflight = new Map<string, Promise<Place | null>>();

function keyOf(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

// Synchronous peek — returns a cached result if we already have one.
export function peekPlace(lat: number, lng: number): Place | null | undefined {
  return cache.get(keyOf(lat, lng));
}

const NAME_TYPES = ['point_of_interest', 'establishment', 'park', 'airport', 'transit_station', 'natural_feature'];

function parse(j: any): Place | null {
  const results: any[] = j?.results;
  if (!results?.length) return null;
  const comp = (res: any, type: string) => res.address_components?.find((c: any) => c.types.includes(type))?.long_name;

  const primary = results[0];

  // Only use a real establishment/landmark name — a component that is itself
  // typed as a place name (not a house/subpremise number).
  let title: string | undefined;
  for (const r of results) {
    const nameComp = r.address_components?.find((c: any) => c.types?.some((t: string) => NAME_TYPES.includes(t)));
    if (nameComp?.long_name) {
      title = nameComp.long_name;
      break;
    }
  }

  if (!title) {
    const num = comp(primary, 'street_number');
    const route = comp(primary, 'route');
    title =
      [num, route].filter(Boolean).join(' ') ||
      route ||
      comp(primary, 'neighborhood') ||
      comp(primary, 'sublocality') ||
      comp(primary, 'locality') ||
      (primary.formatted_address || '').split(',')[0];
  }

  const full = (primary.formatted_address || '').split(',').slice(0, 3).join(',').trim();
  return title ? { title, full } : null;
}

export async function reverseGeocode(lat: number, lng: number, _priority = false): Promise<Place | null> {
  const k = keyOf(lat, lng);
  if (cache.has(k)) return cache.get(k)!;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = (async () => {
    try {
      if (!KEY) return null;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${KEY}`, {
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const place = parse(await r.json());
      cache.set(k, place);
      return place;
    } catch {
      cache.set(k, null);
      return null;
    } finally {
      inflight.delete(k);
    }
  })();
  inflight.set(k, p);
  return p;
}

// Is a stored name just a generic placeholder (so we should reverse-geocode)?
export function isGenericName(name: string | null | undefined) {
  if (!name) return true;
  return /^(public\s+)?(restroom|toilet|toilets|wc|bathroom|public toilet)s?$/i.test(name.trim());
}

export function bestTitle(name: string | null | undefined, resolved?: Place | null) {
  if (!isGenericName(name)) return name as string;
  if (resolved?.title) return resolved.title;
  return name || 'Public restroom';
}
