// Push notifications are native-only (lib/push.native.ts); on web these do nothing.
export async function registerPush(_userId: string) {}
export async function unregisterPush(_userId: string) {}
export async function clearBadge() {}
export function usePushNavigation(_navReady: boolean) {}
