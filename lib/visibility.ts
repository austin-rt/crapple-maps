import type { Visibility } from '@/lib/types';

export const VISIBILITIES: readonly Visibility[] = ['public', 'friends', 'private'];

export const VIS_LABEL: Record<Visibility, string> = { public: 'Public', friends: 'Friends', private: 'Private' };

export const VIS_ICON: Record<Visibility, 'earth' | 'people-outline' | 'lock-closed-outline'> = {
  public: 'earth',
  friends: 'people-outline',
  private: 'lock-closed-outline',
};

export const VIS_HINT: Record<Visibility, string> = {
  public: 'Anyone can see your posts on your profile and map.',
  friends: 'Only people you approve as followers can see your posts.',
  private: 'Only you can see your posts.',
};
