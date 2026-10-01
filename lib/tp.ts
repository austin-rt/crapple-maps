// Toilet paper quality, stored on a log as tp_quality 1–4.
export const TP = [
  { n: 1, emoji: '🚫', label: 'None' },
  { n: 2, emoji: '🪵', label: 'Sandpaper' },
  { n: 3, emoji: '🧻', label: 'Decent' },
  { n: 4, emoji: '☁️', label: 'Plush' },
] as const;

export function tp(n: number | null | undefined) {
  return n ? TP.find((t) => t.n === n) ?? null : null;
}
