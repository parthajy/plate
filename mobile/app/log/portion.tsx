import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MealType } from '@plate/shared';
import { api, ApiError } from '../../lib/api';
import { useLogFood } from '../../hooks/useDailyLogs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';

interface FoodDetail {
  id: string;
  name: string;
  brand: string | null;
  servingG: string | null;
  kcalPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
}

const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function pickDefaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

export default function PortionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ foodId?: string; name?: string; custom?: string }>();
  const isCustom = params.custom === '1';

  // Fetch the food row for the selected DB entry (skipped when custom)
  const { data: food } = useQuery({
    queryKey: ['food', 'detail', params.foodId],
    queryFn: () =>
      api.get<{ items: FoodDetail[] }>(
        `/v1/food/search?q=${encodeURIComponent(params.name ?? '')}&limit=5`,
      ),
    enabled: !isCustom && !!params.foodId,
    staleTime: 5 * 60_000,
    select: (resp) => resp.items.find((it) => it.id === params.foodId) ?? null,
  });

  const isoDate = toIsoDate(new Date());
  const logFood = useLogFood(isoDate);

  const [grams, setGrams] = useState<string>(food?.servingG ?? '100');
  const [meal, setMeal] = useState<MealType>(pickDefaultMeal());
  const [err, setErr] = useState<string | null>(null);

  // Custom-entry overrides
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  useEffect(() => {
    if (food?.servingG && !grams) setGrams(food.servingG);
  }, [food, grams]);

  const gNum = Number(grams);
  const computed = useMemo(() => {
    if (isCustom) {
      return {
        kcal: Number(customKcal),
        proteinG: Number(customProtein),
        carbsG: Number(customCarbs),
        fatG: Number(customFat),
      };
    }
    if (!food || !gNum) return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    const f = gNum / 100;
    return {
      kcal: Number(food.kcalPer100g) * f,
      proteinG: Number(food.proteinPer100g) * f,
      carbsG: Number(food.carbsPer100g) * f,
      fatG: Number(food.fatPer100g) * f,
    };
  }, [food, gNum, isCustom, customKcal, customProtein, customCarbs, customFat]);

  const valid = isCustom
    ? gNum > 0 && computed.kcal >= 0 && computed.proteinG >= 0
    : gNum > 0 && !!food;

  const onSubmit = async () => {
    if (!valid) return;
    setErr(null);
    try {
      await logFood.mutateAsync({
        ...(isCustom ? { name: params.name } : { foodId: params.foodId }),
        grams: gNum,
        kcal: Math.round(computed.kcal * 10) / 10,
        proteinG: Math.round(computed.proteinG * 10) / 10,
        carbsG: Math.round(computed.carbsG * 10) / 10,
        fatG: Math.round(computed.fatG * 10) / 10,
        mealType: meal,
        loggedAt: new Date().toISOString(),
        source: 'manual',
      });
      router.dismissAll();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not log entry.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text style={[type.label, { color: colors.text2, letterSpacing: 1 }]}>QUICK LOG</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <X color={colors.text2} size={22} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={[type.display2, { color: colors.text }]}>{params.name ?? 'Food'}</Text>
        {food?.brand ? (
          <Text style={[type.body, { color: colors.text3, marginTop: 4 }]}>{food.brand}</Text>
        ) : isCustom ? (
          <Text style={[type.body, { color: colors.text3, marginTop: 4 }]}>Custom entry</Text>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Input
            label="Grams"
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            placeholder="100"
          />
        </View>

        {isCustom ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Input
              label="Calories"
              value={customKcal}
              onChangeText={setCustomKcal}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Protein (g)"
                  value={customProtein}
                  onChangeText={setCustomProtein}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Carbs (g)"
                  value={customCarbs}
                  onChangeText={setCustomCarbs}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Fat (g)"
                  value={customFat}
                  onChangeText={setCustomFat}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={[type.monoSm, { color: colors.text3, letterSpacing: 1.2 }]}>
              FOR {Math.round(gNum)}G
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
              <Text style={[type.display1, { color: colors.text, fontSize: 36 }]}>
                {Math.round(computed.kcal)}
              </Text>
              <Text style={{ ...type.body, color: colors.text3, marginLeft: 6 }}>kcal</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <Text style={{ ...type.bodySm, color: colors.text2 }}>
                P <Text style={{ color: colors.text }}>{Math.round(computed.proteinG)}g</Text>
              </Text>
              <Text style={{ ...type.bodySm, color: colors.text2 }}>
                C <Text style={{ color: colors.text }}>{Math.round(computed.carbsG)}g</Text>
              </Text>
              <Text style={{ ...type.bodySm, color: colors.text2 }}>
                F <Text style={{ color: colors.text }}>{Math.round(computed.fatG)}g</Text>
              </Text>
            </View>
          </View>
        )}

        <View style={{ marginTop: 22 }}>
          <Text
            style={{
              ...type.monoSm,
              color: colors.text3,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Meal
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MEALS.map((m) => (
              <Chip
                key={m.value}
                label={m.label}
                selected={meal === m.value}
                onPress={() => setMeal(m.value)}
              />
            ))}
          </View>
        </View>

        {err ? (
          <Text style={[type.bodySm, { color: colors.danger, marginTop: 16 }]}>{err}</Text>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 8,
          backgroundColor: colors.bg,
        }}
      >
        <Button
          label="Log it"
          size="lg"
          onPress={() => void onSubmit()}
          disabled={!valid}
          loading={logFood.isPending}
        />
      </View>
    </View>
  );
}
