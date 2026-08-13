import { View } from 'react-native';

import { AgeGate, AuthForm, ManageProfile } from '@/components/profile';
import { useAgeGate } from '@/hooks/useAgeGate';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { session } = useAuth();
  const gate = useAgeGate(session?.user.id);

  if (!session) return <AuthForm />;
  // Every sign-up path — email, Google, Apple — lands here, so the 13+ check is
  // unavoidable rather than only firing if they happen to open the feed.
  if (gate === 'loading') return <View className="flex-1 bg-surface" />;
  if (gate === 'blocked') return <AgeGate />;
  return <ManageProfile />;
}
