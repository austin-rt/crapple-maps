// Design tokens. Kept dependency-free so any UI atom can import them without
// dragging in the auth/supabase graph. (Tailwind class-strings live under
// components/ui/ instead — lib/ is not scanned by the tailwind content globs.)

// The brand accent is single-sourced in theme/brand.js so ONE edit re-themes both
// the JS side (icons/SVGs/inline styles, via this constant) and the Tailwind
// `accent` color (bg-accent/text-accent classes).
export { ACCENT } from '@/theme/brand';
export const DANGER = '#DC2626'; // destructive actions / selected marker / closed now
export const OPEN = '#16A34A'; // open-now label (matches ACCESS.public green)

// Rating stars are the classic gold everyone already reads as a rating, NOT the
// brand accent — in accent teal they looked like just another UI control. A
// touch deeper than AMENITY.code's amber so the two stay distinguishable, and it
// holds contrast on both the light and dark surfaces.
export const STAR = '#F5B301';

// Amenity symbol colors — powder tones complementary to the teal accent. Each
// symbol ALWAYS renders in its color (via components/ui/AmenityIcon) so they
// read at a glance without labels.
export const AMENITY = {
  accessible: '#38BDF8', // powder sky — wheelchair accessible
  unisex: '#A78BFA', // powder purple — gender neutral
  changing: '#F472B6', // powder pink — changing table
  code: '#FBBF24', // powder amber — door code required
  purchase: '#34D399', // powder mint — purchase required
} as const;
export const VISITED = '#7C3AED'; // visited/logged marker (purple)
export const LIKE = '#EF4444'; // like heart (red)
export const ON_ACCENT = '#FFFFFF'; // text/icons on the accent or other solid color buttons
