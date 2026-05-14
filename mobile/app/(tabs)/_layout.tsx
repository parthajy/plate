import { Redirect, Tabs } from 'expo-router';
import { Home, MessageCircle, ScanLine, Dumbbell, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function TabsLayout() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  if (status !== 'authenticated') return <Redirect href="/(auth)/welcome" />;
  if (!user?.onboardedAt) return <Redirect href="/(onboarding)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 64 + (Platform.OS === 'ios' ? 24 : 12),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: { ...type.monoSm, letterSpacing: 1.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'TODAY',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'COACH',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size - 2} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'SCAN',
          tabBarIcon: ({ color, size }) => (
            <ScanLine color={color} size={size - 2} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'WORKOUTS',
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size - 2} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'YOU',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
