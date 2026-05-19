import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { MealType, Recipe } from '@plate/shared';
import { Button } from '../ui/Button';
import { useLogFood } from '../../hooks/useDailyLogs';
import { ApiError } from '../../lib/api';
import { toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';

// Renders a generated recipe: title with AI badge, meta line, numbered steps,
// "also need" callout, meal-picker, "Log a serving" CTA. Used inline on the
// pantry screen right after generation AND on /recipes/[id] for past recipes.

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

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const isoDate = toIsoDate(new Date());
  const logFood = useLogFood(isoDate);
  const [meal, setMeal] = useState<MealType>(pickDefaultMeal());
  const [logged, setLogged] = useState(false);

  const servingGrams = useMemo(() => {
    const total = recipe.ingredients.reduce((acc, i) => acc + i.grams, 0);
    return Math.round(total / Math.max(1, recipe.servings));
  }, [recipe]);

  const m = recipe.macrosPerServing;
  const metaLine = `${recipe.totalMinutes} MIN · ${Math.round(m.proteinG)}g·P · ${Math.round(m.kcal)} KCAL`;

  const onLog = async () => {
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
      setLogged(true);
    } catch (e) {
      Alert.alert('Could not log', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

  return (
    <View
      style={{
        marginTop: 26,
        padding: 20,
        borderRadius: radius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Text
          style={{
            ...type.display2,
            color: colors.text,
            fontStyle: 'italic',
            flex: 1,
            fontSize: 28,
            lineHeight: 32,
          }}
        >
          {recipe.title}
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: colors.accent,
            marginTop: 4,
          }}
        >
          <Text
            style={{
              ...type.monoSm,
              color: colors.accent,
              letterSpacing: 1.5,
              fontWeight: '700',
            }}
          >
            AI
          </Text>
        </View>
      </View>

      <Text style={{ ...type.monoSm, color: colors.text2, letterSpacing: 1.3, marginTop: 8 }}>
        {metaLine}
      </Text>

      {recipe.description ? (
        <Text style={[type.bodySm, { color: colors.text3, marginTop: 10, lineHeight: 20 }]}>
          {recipe.description}
        </Text>
      ) : null}

      <View style={{ marginTop: 18, gap: 14 }}>
        {recipe.steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.accent,
                letterSpacing: 0.8,
                width: 22,
                marginTop: 4,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text style={[type.body, { color: colors.text, flex: 1, lineHeight: 22 }]}>{s}</Text>
          </View>
        ))}
      </View>

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
              color: colors.text2,
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

      <Text
        style={{
          ...type.monoSm,
          color: colors.text2,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        Log as
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MEALS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setMeal(opt.value)}
            hitSlop={4}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: meal === opt.value ? colors.accent : 'transparent',
                borderWidth: 1.5,
                borderColor: meal === opt.value ? colors.accent : colors.borderHi,
              }}
            >
              <Text
                style={{
                  ...type.bodySm,
                  color: meal === opt.value ? colors.textInv : colors.text2,
                  fontWeight: '600',
                }}
              >
                {opt.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 18 }}>
        <Button
          label={logged ? 'Logged ✓' : 'Log a serving'}
          size="lg"
          onPress={() => void onLog()}
          loading={logFood.isPending}
          disabled={logged}
        />
      </View>
    </View>
  );
}
