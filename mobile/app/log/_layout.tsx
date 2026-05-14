import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../stores/auth';

export default function LogLayout() {
  const status = useAuth((s) => s.status);
  if (status !== 'authenticated') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
        contentStyle: { backgroundColor: '#0b0b0a' },
      }}
    />
  );
}
