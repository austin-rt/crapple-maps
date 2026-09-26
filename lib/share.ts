import { Platform, Share } from 'react-native';

import { toast } from '@/lib/toast';

export const profileUrl = (username: string) => `https://crapplemaps.com/u/${encodeURIComponent(username)}`;

// Opens the OS share sheet with a link that lands on the sharer's profile, where
// the recipient can follow them. iOS takes the link as `url` so Messages renders
// it as a link card; Android only reads `message`, so the link rides in the text.
// Web uses the Web Share API where the browser has it and copies the link
// otherwise.
export async function shareProfile(username: string) {
  const url = profileUrl(username);
  const text = 'Follow me on Crapple Maps';
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Crapple Maps', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', url);
      }
      return;
    }
    await Share.share(Platform.OS === 'ios' ? { message: text, url } : { message: `${text}: ${url}` });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    toast.error("Couldn't share", e?.message);
  }
}
