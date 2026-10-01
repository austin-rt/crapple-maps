import { Segmented, type IconName } from '@/components/ui';

import { useThemePref, type ThemePref } from '@/lib/theme';

import { Card } from './Card';

const THEME_OPTS: [string, ThemePref, IconName][] = [
  ['System', 'system', 'phone-portrait-outline'],
  ['Light', 'light', 'sunny-outline'],
  ['Dark', 'dark', 'moon-outline'],
];

export function AppearanceCard() {
  const { pref, setPref } = useThemePref();
  return (
    <Card title="Appearance">
      <Segmented options={THEME_OPTS} value={pref} onChange={setPref} />
    </Card>
  );
}
