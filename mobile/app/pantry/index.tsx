import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X as XIcon } from 'lucide-react-native';
import type {
  MealType,
  PantryItem,
  PantryListResponse,
  Recipe,
  RecipeFilters,
  RecipeResponse,
} from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { api, ApiError } from '../../lib/api';
import { useLogFood } from '../../hooks/useDailyLogs';
import { toIsoDate } from '../../lib/formatters';
import { RecipeProcessingOverlay } from '../../components/recipe/RecipeProcessingOverlay';
import { colors, radius, type } from '../../lib/theme';

// Common ingredients shown when the user's pantry is empty, so they can
// bootstrap with one tap instead of typing each one.
const QUICK_ADD = [
  'chicken',
  'rice',
  'eggs',
  'pasta',
  'broccoli',
  'onion',
  'garlic',
  'tomato',
  'cheese',
  'oats',
  'salmon',
  'spinach',
  'butter',
];

// Recipe-tuning filters. Keep these terse — they sit on a single wrapping row.
const TIME_FILTERS: { label: string; value: number }[] = [
  { label: '< 15 min', value: 15 },
  { label: '< 30 min', value: 30 },
  { label: '< 60 min', value: 60 },
];

// Show first VISIBLE_CHIPS chips; collapse the rest behind a "+N more" pill
// until the user expands. Keeps the page from getting overwhelmed when the
// pantry has 20+ items.
const VISIBLE_CHIPS = 8;

export default function PantryRecipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput | null>(null);

  const [filters, setFilters] = useState<RecipeFilters>({});
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const { data: pantryData } = useQuery({
    queryKey: ['pantry', 'items'],
    queryFn: () => api.get<PantryListResponse>('/v1/pantry/items'),
    staleTime: 30_000,
  });
  const items = pantryData?.items ?? [];
  const itemNames = useMemo(() => new Set(items.map((i) => i.ingredient.toLowerCase())), [items]);

  const addItem = useMutation({
    mutationFn: (ingredient: string) => api.post<PantryItem>('/v1/pantry/items', { ingredient }),
    onSuccess: (created) => {
      queryClient.setQueryData<PantryListResponse>(['pantry', 'items'], (curr) => {
        const existing = curr?.items.filter((i) => i.id !== created.id) ?? [];
        return { items: [...existing, created] };
      });
    },
  });

  const removeItem = useMutation({
    // 404 = item already gone (perhaps a stale id, perhaps the server raced).
    // Treat as success so the optimistic remove sticks instead of rolling
    // back and making the chip "flicker back."
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/v1/pantry/items/${id}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return;
        throw e;
      }
    },
    onMutate: (id: string) => {
      const prev = queryClient.getQueryData<PantryListResponse>(['pantry', 'items']);
      queryClient.setQueryData<PantryListResponse>(['pantry', 'items'], (curr) => ({
        items: curr?.items.filter((i) => i.id !== id) ?? [],
      }));
      return { prev };
    },
    onError: (err, _v, ctx) => {
      // Revert + surface the real error so we can see what the server said.
      // (Silent failures were making "chip flickers back" feel like a UI bug
      // when the server was actually rejecting the request.)
      if (ctx?.prev) queryClient.setQueryData(['pantry', 'items'], ctx.prev);
      Alert.alert(
        'Could not remove',
        err instanceof ApiError
          ? `${err.status} ${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Unknown error',
      );
    },
  });

  const generate = useMutation({
    mutationFn: (f: RecipeFilters) => api.post<RecipeResponse>('/v1/pantry/recipe', { filters: f }),
    onSuccess: (resp) => {
      queryClient.setQueryData(['pantry', 'recipe', 'last'], resp);
    },
  });

  // Pull the most recently generated recipe out of the cache so it stays
  // visible after navigation back. Cleared when the user explicitly regenerates.
  const recipeResp = queryClient.getQueryData<RecipeResponse>(['pantry', 'recipe', 'last']);
  const recipe = recipeResp?.recipe;

  const onAdd = useCallback(
    (text: string) => {
      const clean = text.trim().toLowerCase();
      if (!clean) return;
      if (itemNames.has(clean)) {
        setDraft('');
        return;
      }
      addItem.mutate(clean);
      setDraft('');
    },
    [addItem, itemNames],
  );

  const toggleTime = (mins: number) =>
    setFilters((f) => ({ ...f, maxMinutes: f.maxMinutes === mins ? undefined : mins }));
  const toggleFlag = (k: 'highProtein' | 'lowCarb' | 'vegetarian') =>
    setFilters((f) => ({ ...f, [k]: f[k] ? undefined : true }));

  const canGenerate = items.length >= 1 && !generate.isPending;

  const visibleItems = expanded ? items : items.slice(0, VISIBLE_CHIPS - 1);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top bar with back arrow */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
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
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (canGenerate ? 110 : 24),
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title + eyebrow */}
        <Text
          style={{
            ...type.display1,
            color: colors.text,
            fontStyle: 'italic',
            fontSize: 38,
            lineHeight: 42,
          }}
        >
          Got these. Make me something.
        </Text>

        <Text
          style={{
            ...type.monoSm,
            color: colors.text2,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 14,
          }}
        >
          {items.length} ingredient{items.length === 1 ? '' : 's'} on hand
          {items.length > 0 ? ' · tap to remove' : ''}
        </Text>

        {/* Ingredient chips, or empty-state Quick Add */}
        {items.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {visibleItems.map((item) => (
              <IngredientChip
                key={item.id}
                label={item.ingredient}
                onPress={() => removeItem.mutate(item.id)}
              />
            ))}
            {hiddenCount > 0 && !expanded ? (
              <MutedChip label={`+ ${hiddenCount} more`} onPress={() => setExpanded(true)} />
            ) : null}
            <AddChip
              onPress={() => {
                setAddOpen((v) => !v);
                setTimeout(() => inputRef.current?.focus(), 60);
              }}
            />
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={[type.body, { color: colors.text2 }]}>
              Nothing in your pantry yet. Tap an option below to add.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {QUICK_ADD.map((q) => (
                <IngredientChip key={q} label={q} onPress={() => onAdd(q)} variant="outline" />
              ))}
              <AddChip
                onPress={() => {
                  setAddOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 60);
                }}
              />
            </View>
          </View>
        )}

        {/* Inline add input (collapsed by default) */}
        {addOpen ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              backgroundColor: colors.surface,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: colors.borderHi,
              paddingHorizontal: 16,
              height: 46,
            }}
          >
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              placeholder="Add ingredient…"
              placeholderTextColor={colors.text3}
              style={{
                ...type.body,
                color: colors.text,
                flex: 1,
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                onAdd(draft);
              }}
            />
            <Pressable
              onPress={() => onAdd(draft)}
              accessibilityLabel="Add"
              hitSlop={8}
              style={{ paddingHorizontal: 4 }}
            >
              <Plus
                size={20}
                color={draft.trim() ? colors.accent : colors.text3}
                strokeWidth={2.6}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Filters */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text2,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 28,
            marginBottom: 12,
          }}
        >
          Filters
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TIME_FILTERS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              selected={filters.maxMinutes === t.value}
              onPress={() => toggleTime(t.value)}
            />
          ))}
          <FilterChip
            label="High protein"
            selected={!!filters.highProtein}
            onPress={() => toggleFlag('highProtein')}
          />
          <FilterChip
            label="Low carb"
            selected={!!filters.lowCarb}
            onPress={() => toggleFlag('lowCarb')}
          />
          <FilterChip
            label="Vegetarian"
            selected={!!filters.vegetarian}
            onPress={() => toggleFlag('vegetarian')}
          />
        </View>

        {/* Inline recipe card (only after a successful generation) */}
        {recipe ? <RecipeCard recipe={recipe} /> : null}

        {generate.isError ? (
          <View
            style={{
              marginTop: 18,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: 'rgba(255,90,90,0.16)',
              borderWidth: 1,
              borderColor: colors.danger,
            }}
          >
            <Text style={[type.bodySm, { color: colors.text }]}>
              {generate.error instanceof ApiError
                ? generate.error.message
                : 'Could not generate a recipe. Try again.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Generate button — hidden when the pantry is empty (nothing to
          generate from) so the empty-state Quick-Add chips have room. */}
      {items.length > 0 ? (
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
            label={recipe ? 'Generate another' : 'Generate recipe'}
            size="lg"
            onPress={() => generate.mutate(filters)}
            disabled={!canGenerate}
            loading={generate.isPending}
          />
        </View>
      ) : null}

      {generate.isPending ? <RecipeProcessingOverlay /> : null}
    </KeyboardAvoidingView>
  );
}

// ----- Chips -----
//
// Layout/bg/border live on an INNER View, not on Pressable's style function.
// RN's Pressable doesn't reliably apply backgroundColor / borderRadius /
// flexDirection when returned from `style={({pressed}) => ({...})}` —
// children stack and the bg never paints. Wrapping in <View> fixes both.
//
// Two visual variants for IngredientChip:
//   filled  — solid accent bg, dark text   (used for items in your pantry — tap to remove)
//   outline — page bg, accent-color border (used for empty-state Quick Add — tap to add)

// Why the JSX-child pattern (not children-as-function): a callback-form
// child on Pressable can swallow the press event in some RN/Hermes
// combinations — the chip RENDERS but onPress never fires when the user
// taps inside it. Switching to a plain View child + a small XIcon inside
// filled chips makes both the visual and the interactive contract obvious:
// the X says "tap to remove", and the hit area is the entire pill.

function IngredientChip({
  label,
  onPress,
  variant = 'filled',
}: {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
}) {
  const filled = variant === 'filled';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={filled ? `Remove ${label}` : `Add ${label}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: filled ? 8 : 0,
          paddingVertical: 9,
          paddingLeft: 16,
          paddingRight: filled ? 10 : 16,
          borderRadius: 999,
          backgroundColor: filled ? colors.accent : 'transparent',
          borderWidth: filled ? 0 : 1.5,
          borderColor: colors.accent,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            color: filled ? colors.textInv : colors.text,
            fontWeight: '600',
            textTransform: 'capitalize',
          }}
        >
          {label}
        </Text>
        {filled ? (
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: 'rgba(0,0,0,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={11} color={colors.textInv} strokeWidth={3} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function MutedChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.text3,
        }}
      >
        <Text style={{ fontSize: 15, color: colors.text3, fontWeight: '600' }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function AddChip({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel="Add ingredient"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.text3,
          borderStyle: 'dashed',
        }}
      >
        <Plus size={16} color={colors.text2} strokeWidth={2.6} />
        <Text style={{ fontSize: 15, color: colors.text2, fontWeight: '600' }}>Add</Text>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: selected ? colors.accent : 'transparent',
          borderWidth: 1.5,
          borderColor: selected ? colors.accent : colors.text3,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            color: selected ? colors.textInv : colors.text,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ----- Recipe card (inline) -----

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

function RecipeCard({ recipe }: { recipe: Recipe }) {
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
      {/* Title row with AI badge */}
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

      {/* Meta line */}
      <Text
        style={{
          ...type.monoSm,
          color: colors.text2,
          letterSpacing: 1.3,
          marginTop: 8,
        }}
      >
        {metaLine}
      </Text>

      {recipe.description ? (
        <Text style={[type.bodySm, { color: colors.text3, marginTop: 10, lineHeight: 20 }]}>
          {recipe.description}
        </Text>
      ) : null}

      {/* Numbered steps */}
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

      {/* Missing ingredients */}
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

      {/* Log as meal */}
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
            style={({ pressed }) => ({
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: radius.full,
              backgroundColor: meal === opt.value ? colors.accent : 'transparent',
              borderWidth: 1.5,
              borderColor: meal === opt.value ? colors.accent : colors.borderHi,
              opacity: pressed ? 0.7 : 1,
            })}
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
