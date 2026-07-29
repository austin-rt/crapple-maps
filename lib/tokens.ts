// Design tokens. Kept dependency-free so any UI atom can import them without
// dragging in the auth/supabase graph. (Tailwind class-strings live under
// components/ui/ instead — lib/ is not scanned by the tailwind content globs.)

// The brand accent is single-sourced in theme/brand.js so ONE edit re-themes both
// the JS side (icons/SVGs/inline styles, via this constant) and the Tailwind
// `accent` color (bg-accent/text-accent classes).
export { ACCENT } from '@/theme/brand';
export const DANGER = '#DC2626'; // destructive actions / selected marker
export const VISITED = '#7C3AED'; // visited/logged marker (purple)
export const LIKE = '#EF4444'; // like heart (red)
export const ON_ACCENT = '#FFFFFF'; // text/icons on the accent or other solid color buttons
