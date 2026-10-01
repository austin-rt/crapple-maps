import { Stack } from 'expo-router';

import { LogMap } from '@/components/LogMap';
import { SignInRequired } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function MyMapScreen() {
  const { session } = useAuth();
  if (!session) return <SignInRequired icon="trail-sign-outline" message="Everywhere you’ve gone, mapped." />;
  return (
    <>
      <Stack.Screen options={{ title: 'Places I’ve Pooped' }} />
      <LogMap userId={session.user.id} own />
    </>
  );
}
