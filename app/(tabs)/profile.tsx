import { View } from 'react-native';

import { AgeGate, AuthForm, ManageProfile, useAgePassed } from '@/components/profile';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [agePassed, setAgePassed] = useAgePassed();

  if (session) return <ManageProfile />;

  // Neutral age screen in front of the whole auth surface — email and OAuth
  // alike. It has to precede auth: Google and Apple create the account the
  // instant the user authenticates, so checking afterwards would mean creating
  // a child's account and deleting it. Nothing leaves the device here.
  if (agePassed === null) return <View className="flex-1 bg-surface" />;
  if (!agePassed) return <AgeGate onPass={() => setAgePassed(true)} />;
  return <AuthForm />;
}
