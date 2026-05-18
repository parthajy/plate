import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChefHat, ChevronRight, Plus } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PantryItem, PantryListResponse } from '@plate/shared';
import { api } from '../../lib/api';
import { foodEmoji } from '../../lib/foodIcons';
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

        <FromYourFridgeCard pantryItems={pantryItems} onOpen={() => router.push('/pantry')} />

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

// ----- From your fridge card -----

// Common ingredients suggested as one-tap adds when not already in pantry.
// Keep this in sync with QUICK_ADD in app/pantry/index.tsx — same vocabulary.
const QUICK_ADD = [
  'eggs',
  'chicken',
  'rice',
  'onion',
  'broccoli',
  'beef',
  'pasta',
  'garlic',
  'tomato',
  'cheese',
  'oats',
  'salmon',
  'spinach',
  'butter',
  'lentils',
  'tortilla',
];

function timeOfDayWord(now = new Date()): string {
  const h = now.getHours();
  if (h < 10) return 'for breakfast?';
  if (h < 14) return 'for lunch?';
  if (h < 17) return 'for a snack?';
  return 'tonight?';
}

function FromYourFridgeCard({
  pantryItems,
  onOpen,
}: {
  pantryItems: PantryItem[];
  onOpen: () => void;
}) {
  const queryClient = useQueryClient();
  const inPantry = useMemo(
    () => new Set(pantryItems.map((i) => i.ingredient.toLowerCase())),
    [pantryItems],
  );
  const candidates = useMemo(() => QUICK_ADD.filter((q) => !inPantry.has(q)), [inPantry]);
  const visible = candidates.slice(0, 4);
  const overflow = candidates.length - visible.length;

  const addItem = useMutation({
    mutationFn: (ingredient: string) => api.post<PantryItem>('/v1/pantry/items', { ingredient }),
    onSuccess: (created) => {
      queryClient.setQueryData<PantryListResponse>(['pantry', 'items'], (curr) => {
        const existing = curr?.items.filter((i) => i.id !== created.id) ?? [];
        return { items: [...existing, created] };
      });
    },
  });

  const titleSuffix = timeOfDayWord();

  return (
    <View style={{ marginTop: 28, position: 'relative' }}>
      {/* Left-edge accent stripe — signature flourish that hints at the
          accent color without taking over the whole card. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          borderRadius: 2,
          backgroundColor: colors.accent,
        }}
      />

      <View
        style={{
          marginLeft: 4,
          padding: 18,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <ChefHat size={16} color={colors.accent} strokeWidth={2} />
          </View>
          <Text
            style={{
              ...type.monoSm,
              color: colors.text2,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              flex: 1,
            }}
          >
            From your fridge
          </Text>
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            accessibilityLabel="Edit pantry"
          >
            <Text style={{ ...type.label, color: colors.accent }}>Edit</Text>
            <ChevronRight size={14} color={colors.accent} strokeWidth={2.4} />
          </Pressable>
        </View>

        {/* Title + subtitle */}
        <Text
          style={{
            color: colors.text,
            fontWeight: '700',
            fontSize: 22,
            lineHeight: 28,
            letterSpacing: -0.3,
            marginTop: 14,
          }}
        >
          What can I make {titleSuffix}
        </Text>
        <Text style={[type.bodySm, { color: colors.text3, marginTop: 6 }]}>
          {pantryItems.length === 0
            ? "Tap a few things you have. I'll cook up a recipe."
            : `${pantryItems.length} in your pantry. Add more, or tap Generate.`}
        </Text>

        {/* Quick-add chips. NOTE: layout MUST live on an inner View, not the
            Pressable's style function — Pressable inconsistently applies
            flexDirection/bg/borderRadius when returned from the style
            callback. Same pattern bug bit the recipe page chips. */}
        {visible.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {visible.map((q) => (
              <Pressable
                key={q}
                onPress={() => addItem.mutate(q)}
                disabled={addItem.isPending}
                accessibilityLabel={`Add ${q}`}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: colors.bg,
                      borderWidth: 1.5,
                      borderColor: colors.text3,
                      opacity: pressed ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{foodEmoji(q)}</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}
                    >
                      {q}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
            {overflow > 0 ? (
              <Pressable onPress={onOpen} accessibilityLabel={`${overflow} more — open pantry`}>
                {({ pressed }) => (
                  <View
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: colors.text3,
                      opacity: pressed ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.text3, fontWeight: '600' }}>
                      +{overflow}
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Generate CTA — same pattern. Layout + bg on inner View. */}
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Generate a recipe"
          style={{ marginTop: 18 }}
        >
          {({ pressed }) => (
            <View
              style={{
                height: 50,
                borderRadius: 999,
                backgroundColor: colors.accent,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: pressed ? 0.85 : 1,
              }}
            >
              <Text
                style={{
                  color: colors.textInv,
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
              >
                Generate a recipe
              </Text>
              <ArrowRight size={18} color={colors.textInv} strokeWidth={2.8} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
