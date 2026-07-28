// Design tokens. Kept dependency-free so any UI atom can import them without
// dragging in the auth/supabase graph. (Tailwind class-strings live under
// components/ui/ instead — lib/ is not scanned by the tailwind content globs.)

// The brand accent is single-sourced in theme/brand.js so ONE edit re-themes both
// the JS side (icons/SVGs/inline styles, via this constant) and the Tailwind
// `accent` color (bg-accent/text-accent classes).
export { ACCENT } from '@/theme/brand';
export const MUTED = '#9CA3AF'; // neutral-400 — placeholders, muted icons/text
export const DANGER = '#DC2626'; // destructive actions
