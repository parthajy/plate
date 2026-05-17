import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDown, ArrowUp, ChevronRight, Flame } from 'lucide-react-native';
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

  // 90-day weight delta: we don't track weight history yet, so leave this
  // empty until weight logging ships. Keep the slot to preserve layout.
  const deltaValue: number | null = null;
  const streak = stats?.currentStreak ?? 0;

  const targetsValue =
    user?.dailyKcal && user?.dailyProteinG
      ? `${user.dailyKcal.toLocaleString()} kcal · ${user.dailyProteinG}g P`
      : '—';
  const activitiesValue = user?.activities?.length ? `${user.activities.length} selected` : '—';
  const goalValue = user?.goal ? (GOAL_LABEL[user.goal] ?? '—') : '—';
  const themeValue = THEME_LABEL[themeMode];
  const unitsValue = units === 'imperial' ? 'Imperial' : 'Metric';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stat strip — three cells separated by hairlines, no card bg */}
      <View style={{ flexDirection: 'row', paddingVertical: 22 }}>
        <StatCell value={weightValue} unit={weightUnit} label="CURRENT" />
        <Divider vertical />
        <StatCell
          value={deltaValue !== null ? Math.abs(deltaValue).toFixed(1) : '—'}
          label="90-DAY"
          italic
          accent
          icon={
            deltaValue === null ? null : deltaValue < 0 ? (
              <ArrowDown size={16} color={colors.accent} strokeWidth={2.6} />
            ) : (
              <ArrowUp size={16} color={colors.accent} strokeWidth={2.6} />
            )
          }
        />
        <Divider vertical />
        <StatCell value={String(streak)} label="DAY STREAK" />
      </View>

      <Divider />

      {/* Lifetime snapshot — tappable card surfacing the 3 most-loved
          metrics. Keeps the user oriented without making them dig into
          /you/stats. */}
      <Pressable
        onPress={() => router.push('/you/stats')}
        accessibilityRole="button"
        accessibilityLabel="View your lifetime stats"
        style={({ pressed }) => ({
          marginTop: 18,
          marginBottom: 6,
          padding: 18,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Flame size={18} color={colors.accent} strokeWidth={1.8} />
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
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <LifetimeStat value={streak} label="day streak" big />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
          <LifetimeStat value={Math.round(stats?.avgKcal ?? 0)} label="kcal / day" />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
          <LifetimeStat value={stats?.totalWorkouts ?? 0} label="workouts" />
        </View>
      </Pressable>

      {/* Settings list — each row is just text + value + chevron, hairline below */}
      <SettingRow
        title="Goals & targets"
        value={targetsValue}
        onPress={() => router.push('/you/goal')}
      />
      <SettingRow
        title="Activities"
        value={activitiesValue}
        onPress={() => router.push('/you/profile')}
      />
      <SettingRow title="Goal" value={goalValue} onPress={() => router.push('/you/goal')} />
      <SettingRow title="Connected apps" value="Not connected" onPress={soon('Connected apps')} />
      <SettingRow title="Notifications" value="Off" onPress={soon('Notifications')} />
      <SettingRow title="Theme" value={themeValue} onPress={pickTheme} />
      <SettingRow title="Units" value={unitsValue} onPress={pickUnits} />
      <SettingRow title="Privacy" onPress={soon('Privacy')} />
      <SettingRow title="Redo onboarding" onPress={() => router.push('/(onboarding)/welcome')} />
      <SettingRow title="Sign out" onPress={confirmSignOut} danger noChevron />

      {/* Delete account — preserved but de-emphasized. Mockup omits it but
          App Store guidelines (5.1.1(v)) require an in-app delete path. */}
      <Pressable
        onPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete account"
        hitSlop={8}
        style={{ paddingVertical: 28, alignItems: 'flex-start' }}
      >
        <Text style={[type.bodySm, { color: colors.text3 }]}>Delete account</Text>
      </Pressable>

      <Text style={[type.bodySm, { color: colors.text3, textAlign: 'center', marginTop: 16 }]}>
        Plate · 0.0.1
      </Text>
    </ScrollView>
  );
}

// ----- Stat strip cells -----

function StatCell({
  value,
  unit,
  label,
  italic,
  accent,
  icon,
}: {
  value: string;
  unit?: string;
  label: string;
  italic?: boolean;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        {icon ? <View style={{ alignSelf: 'center', marginRight: 2 }}>{icon}</View> : null}
        <Text
          style={{
            fontFamily: 'Fraunces_400Regular',
            fontSize: 32,
            lineHeight: 36,
            letterSpacing: -0.6,
            fontStyle: italic ? 'italic' : 'normal',
            color: accent ? colors.accent : colors.text,
          }}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={{
              ...type.labelSm,
              color: colors.text3,
              marginLeft: 1,
              fontSize: 13,
              fontWeight: '500',
            }}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.4,
          marginTop: 6,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ----- Lifetime stat cell -----

function LifetimeStat({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: 'Fraunces_400Regular',
          fontSize: big ? 30 : 22,
          lineHeight: big ? 34 : 26,
          letterSpacing: -0.4,
          color: colors.text,
        }}
      >
        {value.toLocaleString()}
      </Text>
      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ----- Settings row + divider -----

function SettingRow({
  title,
  value,
  onPress,
  danger,
  noChevron,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  noChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => ({
        // `alignSelf: 'stretch'` + `width: '100%'` belt-and-suspenders so the
        // Pressable fills the parent column. Without it the Pressable shrinks
        // to content width and the title/value/chevron stack vertically.
        alignSelf: 'stretch',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: StyleSheet_hairlineWidth,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          ...type.bodyLg,
          color: danger ? colors.danger : colors.text,
          fontWeight: '500',
          flexShrink: 0,
        }}
      >
        {title}
      </Text>
      <View style={{ flex: 1, minWidth: 12 }} />
      {value ? (
        <Text
          style={{
            ...type.body,
            color: colors.text3,
            marginRight: onPress && !noChevron ? 8 : 0,
            flexShrink: 1,
            textAlign: 'right',
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {onPress && !noChevron && !danger ? <ChevronRight size={20} color={colors.text3} /> : null}
    </Pressable>
  );
}

function Divider({ vertical }: { vertical?: boolean }) {
  return (
    <View
      style={
        vertical
          ? {
              width: StyleSheet_hairlineWidth,
              backgroundColor: colors.border,
              alignSelf: 'stretch',
            }
          : { height: StyleSheet_hairlineWidth, backgroundColor: colors.border }
      }
    />
  );
}

// React Native's StyleSheet.hairlineWidth resolves to the thinnest line the
// device can render (0.33 on @3x, 0.5 on @2x). Imported lazily to avoid a
// top-of-file dep on StyleSheet just for one constant.
const StyleSheet_hairlineWidth = 0.5;

// ----- Action sheet helper -----

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
        userInterfaceStyle: colors.bg === '#0b0b0a' ? 'dark' : 'light',
      },
      (idx) => {
        if (idx >= 0 && idx < values.length) onPick(values[idx]!);
      },
    );
    return;
  }
  // Android fallback: plain Alert with a button per option
  Alert.alert(title, `Currently: ${options[values.indexOf(current)]}`, [
    ...options.map((label, i) => ({
      text: label,
      onPress: () => onPick(values[i]!),
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}
