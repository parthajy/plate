import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Flame,
  LogOut,
  RotateCcw,
  Ruler,
  Sun,
  Target,
  Trash2,
  User as UserIcon,
} from 'lucide-react-native';
import type { StatsResponse, Units } from '@plate/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { useSettings, type ThemeMode } from '../../stores/settings';
import { colors, radius, type } from '../../lib/theme';

const GOAL_LABEL: Record<string, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Gain weight',
  recomp: 'Recomp',
};

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function YouTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const updateProfile = useAuth((s) => s.updateProfile);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const themeMode = useSettings((s) => s.themeMode);
  const setThemeMode = useSettings((s) => s.setThemeMode);
  const [savingUnits, setSavingUnits] = useState(false);

  const units = (user?.units ?? 'metric') as Units;

  // Snapshot card data — keeps the streak + average kcal visible right on
  // the settings page so the user can see their lifetime at a glance.
  const { data: stats } = useQuery({
    queryKey: ['me', 'stats', '30d'],
    queryFn: () => api.get<StatsResponse>('/v1/me/stats?window=30d'),
    staleTime: 60_000,
  });

  const onUnitsToggle = async (next: Units) => {
    if (next === units || savingUnits) return;
    setSavingUnits(true);
    try {
      await updateProfile({ units: next });
    } catch {
      Alert.alert('Could not save', 'Try again.');
    } finally {
      setSavingUnits(false);
    }
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

  const weightDisplay = user?.weightKg
    ? units === 'imperial'
      ? `${Math.round(Number(user.weightKg) * 2.20462)} lb`
      : `${Number(user.weightKg).toFixed(1)} kg`
    : '—';
  const heightDisplay = user?.heightCm
    ? units === 'imperial'
      ? formatFeetInches(user.heightCm)
      : `${user.heightCm} cm`
    : '—';
  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 38,
              fontWeight: '700',
              color: colors.textInv,
              lineHeight: 44,
            }}
          >
            {initial}
          </Text>
        </View>
        <Text
          style={[type.display2, { color: colors.text, textAlign: 'center' }]}
          numberOfLines={1}
        >
          {user?.displayName ?? 'You'}
        </Text>
        <Text
          style={[type.body, { color: colors.text3, marginTop: 4, textAlign: 'center' }]}
          numberOfLines={1}
        >
          {user?.email}
        </Text>
      </View>

      {/* Lifetime snapshot — the big tappable card the user kept missing. */}
      <Pressable
        onPress={() => router.push('/you/stats')}
        accessibilityRole="button"
        accessibilityLabel="View your lifetime stats"
        style={({ pressed }) => ({
          padding: 20,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Flame size={22} color={colors.accent} strokeWidth={1.8} />
          <Text
            style={{
              ...type.monoSm,
              color: colors.text3,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            Your lifetime
          </Text>
          <View style={{ flex: 1 }} />
          <ChevronRight size={20} color={colors.text3} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <StatCell value={stats?.currentStreak ?? 0} label="day streak" big />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />
          <StatCell value={stats?.avgKcal ?? 0} label="kcal / day (30d)" />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />
          <StatCell value={stats?.totalWorkouts ?? 0} label="workouts" />
        </View>
      </Pressable>

      {/* Profile */}
      <SectionLabel>Profile</SectionLabel>
      <SectionCard>
        <Row
          icon={<UserIcon size={20} color={colors.text2} strokeWidth={1.8} />}
          title="Body & name"
          subtitle={`${heightDisplay} · ${weightDisplay}`}
          onPress={() => router.push('/you/profile')}
        />
        <Row
          icon={<Target size={20} color={colors.text2} strokeWidth={1.8} />}
          title="Goal"
          subtitle={`${GOAL_LABEL[user?.goal ?? ''] ?? '—'} · ${user?.dailyKcal ?? '—'} kcal/day`}
          onPress={() => router.push('/you/goal')}
        />
        <Row
          icon={<RotateCcw size={20} color={colors.text2} strokeWidth={1.8} />}
          title="Redo onboarding"
          subtitle="Re-answer the 6 questions from scratch"
          onPress={() => router.push('/(onboarding)/welcome')}
        />
      </SectionCard>

      {/* Preferences */}
      <SectionLabel>Preferences</SectionLabel>
      <SectionCard>
        {/* Appearance — row + segmented control inside one card */}
        <View
          style={{
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 18,
            paddingVertical: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RowIcon>
              <Sun size={20} color={colors.text2} strokeWidth={1.8} />
            </RowIcon>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: colors.text }]}>Appearance</Text>
              <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>
                Light, dark, or follow the OS
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface2,
              borderRadius: radius.full,
              padding: 3,
              marginTop: 14,
            }}
          >
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => void setThemeMode(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: themeMode === opt.value }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: themeMode === opt.value ? colors.accent : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    ...type.labelSm,
                    color: themeMode === opt.value ? colors.textInv : colors.text2,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={rowStyle()}>
          <RowIcon>
            <Ruler size={20} color={colors.text2} strokeWidth={1.8} />
          </RowIcon>
          <Text style={[type.body, { color: colors.text, flex: 1 }]}>Units</Text>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface2,
              borderRadius: radius.full,
              padding: 3,
            }}
          >
            <UnitChip
              label="Metric"
              active={units === 'metric'}
              onPress={() => onUnitsToggle('metric')}
            />
            <UnitChip
              label="Imperial"
              active={units === 'imperial'}
              onPress={() => onUnitsToggle('imperial')}
            />
          </View>
        </View>

        <View style={[rowStyle(), { opacity: 0.55 }]}>
          <RowIcon>
            <Bell size={20} color={colors.text3} strokeWidth={1.8} />
          </RowIcon>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: colors.text2 }]}>Notifications</Text>
            <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>
              Coach nudges — coming soon
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                ...type.monoSm,
                color: colors.text3,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              Soon
            </Text>
          </View>
        </View>
      </SectionCard>

      {/* Account */}
      <SectionLabel>Account</SectionLabel>
      <SectionCard>
        <Row
          icon={<LogOut size={20} color={colors.text2} strokeWidth={1.8} />}
          title="Sign out"
          onPress={confirmSignOut}
          chevron={false}
        />
        <Row
          icon={<Trash2 size={20} color={colors.danger} strokeWidth={1.8} />}
          title="Delete account"
          titleColor={colors.danger}
          onPress={confirmDelete}
          chevron={false}
        />
      </SectionCard>

      <Text
        style={{
          ...type.bodySm,
          color: colors.text3,
          marginTop: 28,
          textAlign: 'center',
        }}
      >
        Plate · 0.0.1
      </Text>
    </ScrollView>
  );
}

// Function (not const) so it re-reads the mutable `colors` object after a
// theme switch. A frozen const captures the initial palette and never updates.
// `width: '100%'` is non-negotiable — without it the Pressable shrinks to its
// content width and the icon+text stack vertically inside the parent column.
const rowStyle = () =>
  ({
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  }) as const;

function StatCell({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          ...type.display1,
          color: colors.text,
          fontSize: big ? 32 : 22,
          lineHeight: big ? 36 : 26,
        }}
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
      >
        {label}
      </Text>
    </View>
  );
}

// Section is now a vertical stack with spacing — each child renders as its
// own standalone card via ROW_STYLE.
function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={{ marginTop: 8, gap: 10 }}>{children}</View>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        ...type.monoSm,
        color: colors.text3,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginTop: 24,
        marginLeft: 6,
        marginBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}
    >
      {children}
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  chevron = true,
  titleColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  chevron?: boolean;
  titleColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        ...rowStyle(),
        opacity: pressed ? 0.6 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <RowIcon>{icon}</RowIcon>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: titleColor ?? colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {chevron ? <ChevronRight size={20} color={colors.text3} /> : null}
    </Pressable>
  );
}

function UnitChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? colors.accent : 'transparent',
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={{
          ...type.labelSm,
          color: active ? colors.textInv : colors.text2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}"`;
}
