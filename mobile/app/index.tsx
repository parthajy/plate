import { Redirect } from 'expo-router';
import { useAuth } from '../stores/auth';

export default function RootIndex() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  if (status === 'authenticated') {
    if (!user?.onboardedAt) return <Redirect href="/(onboarding)/welcome" />;
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
