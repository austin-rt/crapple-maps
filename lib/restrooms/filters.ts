// Restroom sort/filter option metadata + access-type presentation. Pure data,
// shared by the finder (filter sheet, pills) and the restroom sheet chips.

export const ACCESS: Record<string, { label: string; color: string }> = {
  public: { label: 'Public', color: '#16A34A' },
  code: { label: 'Code', color: '#D97706' },
  ask_staff: { label: 'Ask staff', color: '#DC2626' },
  customers_only: { label: 'Customers', color: '#2563EB' },
};

export const SORTS = [
  { key: 'near', label: 'Nearest', icon: 'navigate' },
  { key: 'rating', label: 'Top rated', icon: 'star' },
  { key: 'popular', label: 'Most logged', icon: 'flame' },
] as const;
export type SortKey = (typeof SORTS)[number]['key'];

export const FILTERS = [
  { key: 'p_public_only', label: 'Public', icon: 'earth' },
  { key: 'p_free', label: 'Free', icon: 'pricetag' },
  { key: 'p_no_code', label: 'No code', icon: 'keypad' },
  { key: 'p_no_purchase', label: 'No purchase', icon: 'card' },
  { key: 'p_accessible', label: 'Accessible', icon: 'accessibility' },
  { key: 'p_changing_table', label: 'Changing table', icon: 'body' },
  { key: 'p_unisex', label: 'Gender-neutral', icon: 'male-female' },
] as const;
export type FilterKey = (typeof FILTERS)[number]['key'];

// Distance label from a miles value: "123 ft" under 0.1mi, else "0.3 mi".
export function distLabel(d: number | null | undefined) {
  if (d == null) return null;
  return d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`;
}
