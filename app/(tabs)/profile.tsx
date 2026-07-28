import { AuthForm, ManageProfile } from '@/components/profile';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { session } = useAuth();
  return session ? <ManageProfile /> : <AuthForm />;
}
