import { Icon, type IconName } from './Icon';

import { AMENITY } from '@/lib/tokens';

// Prepackaged amenity symbols: one fixed color per symbol, everywhere, so the
// icons work as a quick-reference legend without labels.
export const AMENITY_META = {
  accessible: { icon: 'accessibility', color: AMENITY.accessible, label: 'Accessible' },
  unisex: { icon: 'male-female', color: AMENITY.unisex, label: 'Gender neutral' },
  changing: { icon: 'body', color: AMENITY.changing, label: 'Changing table' },
  code: { icon: 'keypad-outline', color: AMENITY.code, label: 'Code required' },
  purchase: { icon: 'card-outline', color: AMENITY.purchase, label: 'Purchase required' },
} as const;

export type AmenityType = keyof typeof AMENITY_META;

export function AmenityIcon({ type, size = 13 }: { type: AmenityType; size?: number }) {
  const m = AMENITY_META[type];
  return <Icon name={m.icon as IconName} size={size} color={m.color} />;
}
