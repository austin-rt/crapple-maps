import type { IconName } from '@/components/ui';
import type { Visibility } from '@/lib/types';

// Options for the shared Segmented control: label, value, icon.
export const VIS_OPTIONS: [string, Visibility, IconName][] = [
  ['Public', 'public', 'earth'],
  ['Friends', 'friends', 'people-outline'],
  ['Private', 'private', 'lock-closed-outline'],
];

export const VIS_HINT: Record<Visibility, string> = {
  public: 'Anyone can see your posts on your profile and map.',
  friends: 'Only people you approve as followers can see your posts.',
  private: 'Only you can see your posts.',
};
