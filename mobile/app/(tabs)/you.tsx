import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import type { StatsResponse, Units } from '@plate/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { useSettings, type ThemeMode } from '../../stores/settings';
import { colors, radius, type } from '../../lib/theme';

const GOAL_LABEL: Record<string, string> = {
  lose: 'Lose',
  maintain: 'Maintain',
  gain: 'Gain',
  recomp: 'Recomp',
};

const THEME_LABEL: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export default function YouTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const updateProfile = useAuth((s) => s.updateProfile);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const themeMode = useSettings((s) => s.themeMode);
  const setThemeMode = useSettings((s) => s.setThemeMode);

  const units = (user?.units ?? 'metric') as Units;

  const { data: stats } = useQuery({
    queryKey: ['me', 'stats', '90d'],
    queryFn: () => api.get<StatsResponse>('/v1/me/stats?window=90d'),
    staleTime: 60_000,
  });

  // ----- Action handlers -----

  const onUnitsToggle = async (next: Units) => {
    if (next === units) return;
    try {
      await updateProfile({ units: next });
    } catch {
      Alert.alert('Could not save', 'Try again.');
    }
  };

  const pickUnits = () => {
    presentSheet({
      title: 'Units',
      options: ['Metric (kg, cm)', 'Imperial (lb, ft)'],
      values: ['metric', 'imperial'] as const,
      current: units,
      onPick: (v) => void onUnitsToggle(v),
    });
  };

  const pickTheme = () => {
    presentSheet({
      title: 'Theme',
      options: ['Follow system', 'Light', 'Dark'],
      values: ['system', 'light', 'dark'] as const,
      current: themeMode,
      onPick: (v) => setThemeMode(v),
    });
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      "This permanently removes your account, profile, food logs, workouts, and coach history. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert('Could not delete', 'Try again.');
            }
          },
        },
      ],
    );
  };

  const soon = (feature: string) => () =>
    Alert.alert(feature, 'Coming soon. We’re working on it.', [{ text: 'OK' }]);

  // ----- Display strings -----

  const weightUnit = units === 'imperial' ? 'lb' : 'kg';
  const weightValue = user?.weightKg
    ? units === 'imperial'
      ? Math.round(Number(user.weightKg) * 2.20462).toString()
      : Number(user.weightKg).toFixed(1)
    : '—';

  const heightCm = user?.heightCm;
  const heightDisplay = heightCm
    ? units === 'imperial'
      ? formatFeetInches(heightCm)
      : `${heightCm} cm`
    : null;

  const streak = stats?.currentStreak ?? 0;
  const avgKcal = Math.round(stats?.avgKcal ?? 0);
  const totalWorkouts = stats?.totalWorkouts ?? 0;
  const daysLogged = stats?.daysLogged ?? 0;

  const goalLabel = user?.goal ? (GOAL_LABEL[user.goal] ?? null) : null;
  const targetsValue =
    user?.dailyKcal && goalLabel
      ? `${goalLabel} · ${user.dailyKcal.toLocaleString()} kcal`
      : user?.dailyKcal
        ? `${user.dailyKcal.toLocaleString()} kcal`
        : '—';

  const activitiesCount = user?.activities?.length ?? 0;
  const bodyValue =
    user?.weightKg && heightDisplay
      ? `${weightValue} ${weightUnit} · ${heightDisplay}${activitiesCount > 0 ? ` · ${activitiesCount} activit${activitiesCount === 1 ? 'y' : 'ies'}` : ''}`
      : '—';

  const themeValue = THEME_LABEL[themeMode];
  const unitsValue = units === 'imperial' ? 'Imperial' : 'Metric';

  return (
    // Outer View carries the bg so the safe-area zone has an opaque backdrop
    // and scrolled content can't appear to "leak" into the status-bar text.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero: a single big stat (weight) + streak chip ─── */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          You
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginTop: 8,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontFamily: 'Fraunces_400Regular',
              fontSize: 64,
              lineHeight: 64,
              letterSpacing: -1.8,
              color: colors.text,
            }}
          >
            {weightValue}
          </Text>
          <Text
            style={{
              fontFamily: 'Fraunces_400Regular',
              fontSize: 22,
              lineHeight: 28,
              color: colors.text3,
              marginBottom: 6,
            }}
          >
            {weightUnit}
          </Text>
        </View>

        {/* Subline with streak — replaces the redundant DAY STREAK stat cell */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: colors.accent,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textInv,
                letterSpacing: 0.2,
              }}
            >
              {streak} day streak
            </Text>
          </View>
          <Text style={[type.bodySm, { color: colors.text3 }]}>· current weight</Text>
        </View>

        {/* ─── Lifetime card (no streak duplication — that's in the hero now) ─── */}
        <Pressable
          onPress={() => router.push('/you/stats')}
          accessibilityRole="button"
          accessibilityLabel="View your lifetime stats"
          style={({ pressed }) => ({
            marginTop: 26,
            paddingVertical: 16,
            paddingHorizontal: 18,
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.text2,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              Your lifetime
            </Text>
            <ChevronRight size={18} color={colors.text3} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 12 }}>
            <LifetimeStat value={avgKcal.toLocaleString()} label="kcal / day" />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <LifetimeStat value={String(totalWorkouts)} label="workouts" />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <LifetimeStat value={String(daysLogged)} label="days logged" />
          </View>
        </Pressable>

        {/* ─── PROFILE ─── */}
        <SectionHeader>Profile</SectionHeader>
        <SettingRow
          title="Goals & targets"
          value={targetsValue}
          onPress={() => router.push('/you/goal')}
        />
        <SettingRow
          title="Body & activities"
          value={bodyValue}
          onPress={() => router.push('/you/profile')}
          isLast
        />

        {/* ─── PREFERENCES ─── */}
        <SectionHeader>Preferences</SectionHeader>
        <SettingRow title="Theme" value={themeValue} onPress={pickTheme} />
        <SettingRow title="Units" value={unitsValue} onPress={pickUnits} />
        <SettingRow title="Notifications" value="Off" onPress={soon('Notifications')} />
        <SettingRow
          title="Connected apps"
          value="Not connected"
          onPress={soon('Connected apps')}
          isLast
        />

        {/* ─── ACCOUNT ─── */}
        <SectionHeader>Account</SectionHeader>
        <SettingRow title="Privacy" onPress={soon('Privacy')} />
        <SettingRow
          title="Redo onboarding"
          onPress={() => router.push('/(onboarding)/welcome')}
          isLast
        />

        {/* ─── Sign out / delete / version ─── */}
        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            hitSlop={10}
            style={({ pressed }) => ({
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: colors.danger,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                ...type.bodyLg,
                color: colors.danger,
                fontWeight: '600',
              }}
            >
              Sign out
            </Text>
          </Pressable>

          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            hitSlop={10}
            style={({ pressed }) => ({
              marginTop: 22,
              paddingVertical: 6,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Text style={[type.bodySm, { color: colors.text3, textDecorationLine: 'underline' }]}>
              Delete account
            </Text>
          </Pressable>

          <Text style={[type.bodySm, { color: colors.text3, marginTop: 28 }]}>Plate · 0.0.1</Text>
        </View>
      </ScrollView>

      {/* Opaque backdrop behind iOS status bar — prevents scrolled content
          from visually colliding with the clock / TestFlight indicator. */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.bg,
        }}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── SettingRow ─────────────────────────────────────────────────────────────
//
// Layout is done in an inner View (not the Pressable itself) because
// Pressable's flex behaviour in RN can collapse to its intrinsic content
// width — that's how we lost the row layout in the previous build and the
// chevron started rendering on its own line above the title. The Pressable
// here just handles the tap target + the hairline divider; the inner View
// owns the flex row so we can be confident title/value/chevron stay inline.

function SettingRow({
  title,
  value,
  onPress,
  danger,
  isLast,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}) {
  const interactive = !!onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => ({
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <Text
          style={{
            ...type.bodyLg,
            color: danger ? colors.danger : colors.text,
            fontWeight: '500',
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {value ? (
          <Text
            style={{
              ...type.body,
              color: colors.text3,
              textAlign: 'right',
              maxWidth: '60%',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value}
          </Text>
        ) : null}
        {interactive ? <ChevronRight size={18} color={colors.text3} /> : null}
      </View>
    </Pressable>
  );
}

// ─── SectionHeader ──────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        ...type.monoSm,
        color: colors.text3,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        marginTop: 32,
        marginBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

// ─── LifetimeStat ───────────────────────────────────────────────────────────

function LifetimeStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: 'Fraunces_400Regular',
          fontSize: 24,
          lineHeight: 28,
          letterSpacing: -0.4,
          color: colors.text,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Action sheet (iOS native sheet, Android Alert fallback) ────────────────

function presentSheet<T extends string>({
  title,
  options,
  values,
  current,
  onPick,
}: {
  title: string;
  options: readonly string[];
  values: readonly T[];
  current: T;
  onPick: (v: T) => void;
}) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options, 'Cancel'],
        cancelButtonIndex: options.length,
      },
      (idx) => {
        if (idx >= 0 && idx < values.length) onPick(values[idx]!);
      },
    );
  } else {
    Alert.alert(
      title,
      undefined,
      [
        ...options.map((label, i) => ({
          text: label + (values[i] === current ? '  ✓' : ''),
          onPress: () => onPick(values[i]!),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}"`;
}
