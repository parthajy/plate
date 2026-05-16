import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Flame, Users } from 'lucide-react-native';
import type { MealType, RecipeResponse } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useLogFood } from '../../hooks/useDailyLogs';
import { ApiError } from '../../lib/api';
import { toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';

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

export default function RecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const recipeResp = queryClient.getQueryData<RecipeResponse>(['pantry', 'recipe', 'last']);
  const recipe = recipeResp?.recipe;

  const isoDate = toIsoDate(new Date());
  const logFood = useLogFood(isoDate);
  const [meal, setMeal] = useState<MealType>(pickDefaultMeal());

  const servingGrams = useMemo(() => {
    if (!recipe) return 0;
    const total = recipe.ingredients.reduce((acc, i) => acc + i.grams, 0);
    return Math.round(total / Math.max(1, recipe.servings));
  }, [recipe]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 }}>
        <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
          No recipe loaded.
        </Text>
        <View style={{ height: 16 }} />
        <Button label="Back to pantry" onPress={() => router.replace('/pantry')} />
      </View>
    );
  }

  const onLogServing = async () => {
    const m = recipe.macrosPerServing;
    try {
      await logFood.mutateAsync({
        name: recipe.title,
        grams: servingGrams || 200,
        kcal: Math.round(m.kcal),
        proteinG: Math.round(m.proteinG * 10) / 10,
        carbsG: Math.round(m.carbsG * 10) / 10,
        fatG: Math.round(m.fatG * 10) / 10,
        mealType: meal,
        loggedAt: new Date().toISOString(),
        source: 'recipe',
      });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Could not log', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

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
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityLabel="Back"
          style={{ paddingRight: 6 }}
        >
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
          Recipe
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.display2, { color: colors.text }]}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={[type.body, { color: colors.text2, marginTop: 10 }]}>
            {recipe.description}
          </Text>
        ) : null}

        {/* Meta + macros card */}
        <View
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Meta
              icon={<Clock size={14} color={colors.text2} />}
              label={`${recipe.totalMinutes} min`}
            />
            <Meta
              icon={<Users size={14} color={colors.text2} />}
              label={`${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`}
            />
            <Meta
              icon={<Flame size={14} color={colors.text2} />}
              label={`${Math.round(recipe.macrosPerServing.kcal)} kcal`}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Macro label="P" value={recipe.macrosPerServing.proteinG} color={colors.protein} />
            <Macro label="C" value={recipe.macrosPerServing.carbsG} color={colors.carbs} />
            <Macro label="F" value={recipe.macrosPerServing.fatG} color={colors.fat} />
          </View>
          <Text style={[type.bodySm, { color: colors.text3 }]}>per serving</Text>
        </View>

        {/* Missing call-out */}
        {recipe.missing.length > 0 ? (
          <View
            style={{
              marginTop: 18,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.borderHi,
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
              Also need
            </Text>
            <Text style={[type.bodySm, { color: colors.text, marginTop: 6 }]}>
              {recipe.missing.join(' · ')}
            </Text>
          </View>
        ) : null}

        {/* Ingredients */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Ingredients
        </Text>
        <View style={{ gap: 6 }}>
          {recipe.ingredients.map((ing, i) => (
            <View
              key={`${ing.name}-${i}`}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={[type.body, { color: colors.text }]}>
                {ing.name}
                {ing.optional ? <Text style={{ color: colors.text3 }}> (optional)</Text> : null}
              </Text>
              <Text style={[type.body, { color: colors.text2 }]}>{Math.round(ing.grams)}g</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 26,
            marginBottom: 8,
          }}
        >
          Steps
        </Text>
        <View style={{ gap: 14 }}>
          {recipe.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <Text
                style={{
                  ...type.label,
                  color: colors.accent,
                  width: 22,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={[type.body, { color: colors.text, flex: 1 }]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Meal chips */}
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
          Log as
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
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom + 14,
          backgroundColor: colors.bg,
        }}
      >
        <Button
          label="Log a serving"
          size="lg"
          onPress={() => void onLogServing()}
          loading={logFood.isPending}
        />
      </View>
    </View>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon}
      <Text style={[type.bodySm, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Text style={{ ...type.label, color, letterSpacing: 1.4 }}>{label}</Text>
      <Text style={{ ...type.body, color: colors.text }}>{Math.round(value)}g</Text>
    </View>
  );
}
