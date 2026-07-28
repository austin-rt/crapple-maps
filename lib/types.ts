// Canonical shared domain types (derived from the LIVE Supabase schema, which
// carries columns not present in migrations 0001–0003: requires_code,
// purchase_required, avatar_seed …). Prop types stay inline in components.

export type AccessType = 'public' | 'customers_only' | 'code' | 'ask_staff';
export type RestroomStatus = 'open' | 'closed' | 'gone';
export type RestroomSource = 'user' | 'osm' | 'refuge';
export type Visibility = 'friends' | 'private';

// A restroom as shown in the finder list / opened in the sheet. `dist` is miles,
// computed client-side from the RPC's `dist_m`.
export type Restroom = {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  address?: string | null;
  access_type: AccessType | null;
  accessible: boolean | null;
  unisex: boolean | null;
  changing_table: boolean | null;
  requires_code?: boolean | null;
  purchase_required?: boolean | null;
  dist: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
  log_count?: number | null;
};

// Extra listing detail fetched on demand for the open restroom.
export type RestroomInfo = {
  directions: string | null;
  hours: string | null;
  description: string | null;
  purchase_required: boolean | null;
  requires_code: boolean | null;
};

// Fields collected by the shared create/edit form.
export type RestroomDraft = {
  name: string;
  lat: number;
  lng: number;
  accessible: boolean | null;
  unisex: boolean | null;
  changing_table: boolean | null;
  access_type: AccessType | null;
  requires_code: boolean | null;
  purchase_required: boolean | null;
  directions: string;
  codes: string[];
};

export type Code = { id: string; code: string; posted_at: string };
export type Review = { id: string; overall_rating: number | null; description: string | null; created_at: string };

export type Author = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
};

// A personal visit log (own map / compose).
export type LogItem = {
  id: string;
  lat: number;
  lng: number;
  rating: number | null;
  bristol_type: number | null;
  caption: string | null;
  visibility: Visibility;
  created_at: string;
  photos: string[];
};

// A feed entry — a log plus its author.
export type FeedLog = LogItem & { user_id: string; author: Author | null };

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
};
