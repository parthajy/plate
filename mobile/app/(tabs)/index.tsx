import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChefHat, ChevronRight, Plus } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import type { PantryListResponse } from '@plate/shared';
import { api } from '../../lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalorieRing } from '../../components/today/CalorieRing';
import { MacroBar } from '../../components/today/MacroBar';
import { MealRow } from '../../components/today/MealRow';
import { DateScrubber } from '../../components/today/DateScrubber';
import { useDailyLogs, useDeleteLog } from '../../hooks/useDailyLogs';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useAuth } from '../../stores/auth';
import { fmtDateStamp, toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';

export default function Today() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [date, setDate] = useState(new Date());

  const isoDate = toIsoDate(date);
  const { data, refetch, isFetching, isLoading } = useDailyLogs(isoDate);
  const { data: workoutsData } = useWorkouts(isoDate);
  const { data: pantryData } = useQuery({
    queryKey: ['pantry', 'items'],
    queryFn: () => api.get<PantryListResponse>('/v1/pantry/items'),
    staleTime: 60_000,
  });
  const pantryItems = pantryData?.items ?? [];
  const deleteLog = useDeleteLog(isoDate);
  const kcalOut = workoutsData?.totals.kcalBurned ?? 0;

  const target = useMemo(
    () => ({
      kcal: user?.dailyKcal ?? 2400,
      proteinG: user?.dailyProteinG ?? 160,
      carbsG: user?.dailyCarbsG ?? 250,
      fatG: user?.dailyFatG ?? 80,
    }),
    [user],
  );

  const totals = data?.totals ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const logs = data?.logs ?? [];

  const onDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete entry?', 'This removes the food log permanently.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLog.mutate(id),
        },
      ]);
    },
    [deleteLog],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 88,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.text3}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {fmtDateStamp(new Date())}
        </Text>
        <Text style={[type.display2, { color: colors.text, marginTop: 6 }]}>
          {user?.displayName ? `Hi, ${user.displayName}.` : 'Today.'}
        </Text>

        <View style={{ marginTop: 4, marginBottom: 12 }}>
          <DateScrubber date={date} onChange={setDate} />
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 18 }}>
          <CalorieRing consumed={totals.kcal} target={target.kcal} />
        </View>

        {kcalOut > 0 ? (
          <View
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 6,
              marginTop: -6,
              marginBottom: 4,
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
              Out
            </Text>
            <Text style={[type.label, { color: colors.accentDim }]}>−{kcalOut} kcal</Text>
            <Text style={[type.bodySm, { color: colors.text3 }]}>· today</Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MacroBar
            label="Protein"
            current={totals.proteinG}
            target={target.proteinG}
            color={colors.protein}
          />
          <MacroBar
            label="Carbs"
            current={totals.carbsG}
            target={target.carbsG}
            color={colors.carbs}
          />
          <MacroBar label="Fat" current={totals.fatG} target={target.fatG} color={colors.fat} />
        </View>

        <View style={{ marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                ...type.monoSm,
                color: colors.text2,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              From your fridge
            </Text>
            <Pressable
              onPress={() => router.push('/pantry')}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ ...type.label, color: colors.accent }}>Edit</Text>
              <ChevronRight size={14} color={colors.accent} strokeWidth={2.4} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/pantry')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 999,
              // `accent` flips lime → dark-olive between modes; pairs cleanly
              // with `textInv` for the chip label.
              backgroundColor: colors.accent,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
            accessibilityRole="button"
            accessibilityLabel="What can I make from what I have"
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChefHat size={22} color={colors.textInv} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...type.display3,
                  color: colors.textInv,
                  fontSize: 20,
                  lineHeight: 24,
                }}
              >
                What can I make today?
              </Text>
              <Text
                style={{
                  ...type.bodySm,
                  color: colors.textInv,
                  opacity: 0.72,
                  marginTop: 2,
                }}
              >
                {pantryItems.length > 0
                  ? `${pantryItems.length} ingredient${pantryItems.length === 1 ? '' : 's'} in your pantry`
                  : "Tap on what you have, I'll cook up a recipe"}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                ...type.monoSm,
                color: colors.text2,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Logged
            </Text>
            <Pressable
              onPress={() => router.push('/log/search')}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} color={colors.accent} strokeWidth={2.5} />
              <Text style={{ ...type.label, color: colors.accent }}>Add</Text>
            </Pressable>
          </View>

          {logs.length === 0 ? (
            <View
              style={{
                marginTop: 12,
                padding: 20,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                alignItems: 'center',
              }}
            >
              <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
                Nothing logged yet.
              </Text>
              <Text
                style={[type.bodySm, { color: colors.text3, marginTop: 4, textAlign: 'center' }]}
              >
                Tap “Add” to log a food in three seconds.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              {logs.map((entry) => (
                <MealRow key={entry.id} entry={entry} onPress={() => onDelete(entry.id)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
