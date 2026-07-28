// Blend a hex 87% toward white — the light "circle" tint used by the MarkerBadge.
export function lightTint(hex: string): string {
  const c = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  const m = (x: number) => Math.round(255 * 0.87 + x * 0.13).toString(16).padStart(2, '0');
  return `#${m(c(1))}${m(c(3))}${m(c(5))}`;
}
