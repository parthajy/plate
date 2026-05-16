import '../global.css';
import { useEffect, useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyTheme, colors } from '../lib/theme';
import { identifyToRevenueCat, initRevenueCat, resetRevenueCatIdentity } from '../lib/revenuecat';
import { useAuth } from '../stores/auth';
import { useSettings } from '../stores/settings';

initRevenueCat();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);
  const hydrateSettings = useSettings((s) => s.hydrate);

  // Theme: explicit setting (system / light / dark) drives the palette.
  // We mutate the shared `colors` synchronously so the first render uses the
  // right values, then key the tree on `mode` so children remount when it flips.
  const scheme = useColorScheme();
  const themeMode = useSettings((s) => s.themeMode);
  const mode: 'light' | 'dark' =
    themeMode === 'light'
      ? 'light'
      : themeMode === 'dark'
        ? 'dark'
        : scheme === 'light'
          ? 'light'
          : 'dark';
  useMemo(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    void hydrate();
    void hydrateSettings();
  }, [hydrate, hydrateSettings]);

  // Keep RevenueCat's user identity synced with our auth state so purchases
  // stick to the user UUID (cross-device, cross-reinstall), not RC's
  // anonymous device id. Subscribe instead of branching the 6 auth flows.
  useEffect(() => {
    const sync = (userId: string | undefined): void => {
      if (userId) void identifyToRevenueCat(userId);
      else void resetRevenueCatIdentity();
    };
    sync(useAuth.getState().user?.id);
    return useAuth.subscribe((state, prev) => {
      if (state.user?.id !== prev.user?.id) sync(state.user?.id);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View key={mode} style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            {status === 'loading' ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            )}
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
