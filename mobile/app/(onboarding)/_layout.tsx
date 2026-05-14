import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../stores/auth';

export default function OnboardingLayout() {
  const status = useAuth((s) => s.status);
  if (status !== 'authenticated') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0b0b0a' },
      }}
    />
  );
}
