// Default profile pictures via DiceBear — free, no account, deterministic per seed.
const STYLE = 'notionists';

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${STYLE}/png?seed=${encodeURIComponent(seed)}&backgroundColor=ede9fe,ddd6fe,e5e7eb`;
}
