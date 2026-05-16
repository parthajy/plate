import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Flame, Footprints, History, TrendingUp } from 'lucide-react-native';
import type { StatsResponse, StatsWindow } from '@plate/shared';
import { api } from '../../lib/api';
import { colors, radius, type } from '../../lib/theme';

const WINDOWS: { value: StatsWindow; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [window, setWindow] = useState<StatsWindow>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'stats', window],
    queryFn: () => api.get<StatsResponse>(`/v1/me/stats?window=${window}`),
    staleTime: 60_000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 6 }}>
          <ChevronLeft color={colors.text2} size={26} />
        </Pressable>
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Your stats
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.display2, { color: colors.text }]}>
          Plate, <Text style={{ color: colors.accent, fontStyle: 'italic' }}>so far</Text>.
        </Text>
        {data?.firstLoggedAt ? (
          <Text style={[type.bodySm, { color: colors.text3, marginTop: 6 }]}>
            Logging since {new Date(data.firstLoggedAt).toLocaleDateString()}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 18,
          }}
        >
          {WINDOWS.map((w) => (
            <Pressable
              key={w.value}
              onPress={() => setWindow(w.value)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.full,
                backgroundColor: window === w.value ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: window === w.value ? colors.accent : colors.border,
                alignItems: 'center',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: window === w.value }}
            >
              <Text
                style={{
                  ...type.labelSm,
                  color: window === w.value ? colors.textInv : colors.text2,
                }}
              >
                {w.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading || !data ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : data.daysLogged === 0 && data.totalWorkouts === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Streak hero */}
            <View
              style={{
                marginTop: 22,
                padding: 18,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...type.monoSm,
                    color: colors.text3,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Streak
                </Text>
                <Text style={[type.display1, { color: colors.text, fontSize: 48, marginTop: 4 }]}>
                  {data.currentStreak}
                  <Text style={[type.body, { color: colors.text3 }]}>
                    {' '}
                    day{data.currentStreak === 1 ? '' : 's'}
                  </Text>
                </Text>
                <Text style={[type.bodySm, { color: colors.text3, marginTop: 4 }]}>
                  Longest: {data.longestStreak} day{data.longestStreak === 1 ? '' : 's'}
                </Text>
              </View>
              <Flame size={56} color={colors.accent} strokeWidth={1.2} />
            </View>

            {/* Calorie + macro averages */}
            <SectionLabel>Daily averages</SectionLabel>
            <View
              style={{
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[type.display1, { color: colors.text, fontSize: 36 }]}>
                  {data.avgKcal}
                </Text>
                <Text style={[type.body, { color: colors.text3, marginLeft: 6 }]}>kcal / day</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
                <Macro label="P" value={data.avgProteinG} color={colors.protein} />
                <Macro label="C" value={data.avgCarbsG} color={colors.carbs} />
                <Macro label="F" value={data.avgFatG} color={colors.fat} />
              </View>
              <Text style={[type.bodySm, { color: colors.text3, marginTop: 10 }]}>
                {data.daysLogged} day{data.daysLogged === 1 ? '' : 's'} logged · {data.totalEntries}{' '}
                entries
              </Text>
            </View>

            {/* Workouts */}
            <SectionLabel>Movement</SectionLabel>
            <View
              style={{
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Stat
                icon={<Footprints size={18} color={colors.accent} strokeWidth={1.8} />}
                value={String(data.totalWorkouts)}
                label="workouts"
              />
              <Stat
                icon={<History size={18} color={colors.accent} strokeWidth={1.8} />}
                value={String(data.totalWorkoutMinutes)}
                label="minutes"
              />
              <Stat
                icon={<TrendingUp size={18} color={colors.accent} strokeWidth={1.8} />}
                value={String(data.totalKcalBurned)}
                label="kcal out"
              />
            </View>

            {/* Top foods */}
            {data.topFoods.length > 0 ? (
              <>
                <SectionLabel>Most logged</SectionLabel>
                <View
                  style={{
                    padding: 4,
                    borderRadius: radius.lg,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {data.topFoods.map((f, i) => (
                    <View
                      key={`${f.name}-${i}`}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth: i === data.topFoods.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                        <Text
                          style={{
                            ...type.mono,
                            color: colors.text3,
                            letterSpacing: 1.2,
                            width: 22,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        <Text
                          style={[type.body, { color: colors.text, flex: 1 }]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                      </View>
                      <Text style={[type.label, { color: colors.text2 }]}>×{f.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        ...type.monoSm,
        color: colors.text3,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginTop: 26,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Text style={{ ...type.label, color, letterSpacing: 1.4 }}>{label}</Text>
      <Text style={{ ...type.body, color: colors.text }}>{value}g</Text>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {icon}
      <Text style={[type.display3, { color: colors.text }]}>{value}</Text>
      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        marginTop: 36,
        padding: 24,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
        Nothing logged in this window yet.
      </Text>
      <Text style={[type.bodySm, { color: colors.text3, marginTop: 6, textAlign: 'center' }]}>
        Log a meal and come back — your story builds itself.
      </Text>
    </View>
  );
}
