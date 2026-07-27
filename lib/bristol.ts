// Bristol stool scale 1–7 as friendly emoji + one-word labels (nobody knows
// "Bristol type"). Shared by the Log form and the Feed.
export const BRISTOL = [
  { n: 1, emoji: '🥜', label: 'Pebbles' },
  { n: 2, emoji: '🍇', label: 'Lumpy' },
  { n: 3, emoji: '🌽', label: 'Cracked' },
  { n: 4, emoji: '🍌', label: 'Smooth' },
  { n: 5, emoji: '🐛', label: 'Soft' },
  { n: 6, emoji: '🍦', label: 'Mushy' },
  { n: 7, emoji: '🌊', label: 'Liquid' },
] as const;

export function bristol(n: number | null | undefined) {
  return n ? BRISTOL.find((b) => b.n === n) ?? null : null;
}
