import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import type { PantryItem, PantryListResponse, RecipeFilters, RecipeResponse } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { api, ApiError } from '../../lib/api';
import { foodEmoji } from '../../lib/foodIcons';
import { RecipeProcessingOverlay } from '../../components/recipe/RecipeProcessingOverlay';
import { colors, radius, type } from '../../lib/theme';

const QUICK_ADD = [
  'chicken',
  'rice',
  'eggs',
  'pasta',
  'broccoli',
  'beef',
  'onion',
  'garlic',
  'tomato',
  'cheese',
  'oats',
  'salmon',
  'spinach',
  'butter',
  'lentils',
  'tortilla',
  'yogurt',
  'oil',
  'salt',
  'pepper',
];

const TIME_FILTERS: { label: string; value: number }[] = [
  { label: '≤ 15 min', value: 15 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 60 min', value: 60 },
];

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});

  const { data: pantryData, isLoading } = useQuery({
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
    mutationFn: (id: string) => api.delete(`/v1/pantry/items/${id}`),
    onMutate: (id: string) => {
      const prev = queryClient.getQueryData<PantryListResponse>(['pantry', 'items']);
      queryClient.setQueryData<PantryListResponse>(['pantry', 'items'], (curr) => ({
        items: curr?.items.filter((i) => i.id !== id) ?? [],
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['pantry', 'items'], ctx.prev);
    },
  });

  const generate = useMutation({
    mutationFn: (f: RecipeFilters) => api.post<RecipeResponse>('/v1/pantry/recipe', { filters: f }),
    onSuccess: (resp) => {
      queryClient.setQueryData(['pantry', 'recipe', 'last'], resp);
      router.push('/pantry/recipe');
    },
  });

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

  const toggleTime = (mins: number) => {
    setFilters((f) => ({ ...f, maxMinutes: f.maxMinutes === mins ? undefined : mins }));
  };
  const toggle = (k: 'highProtein' | 'lowCarb' | 'vegetarian') =>
    setFilters((f) => ({ ...f, [k]: f[k] ? undefined : true }));

  const canGenerate = items.length >= 1 && !generate.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          From your fridge
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          paddingTop: 4,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.display2, { color: colors.text }]}>
          What can I <Text style={{ color: colors.accent, fontStyle: 'italic' }}>make</Text>?
        </Text>
        <Text style={[type.body, { color: colors.text2, marginTop: 8 }]}>
          Tap what you have. I&apos;ll build a recipe.
        </Text>

        {/* Add custom */}
        <View
          style={{
            marginTop: 22,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              height: 48,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add ingredient…"
              placeholderTextColor={colors.text3}
              style={{ ...type.body, color: colors.text }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => onAdd(draft)}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            onPress={() => onAdd(draft)}
            disabled={!draft.trim()}
            accessibilityLabel="Add ingredient"
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: draft.trim() ? colors.accent : 'transparent',
              borderWidth: draft.trim() ? 0 : 1.5,
              borderColor: colors.borderHi,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Plus
              size={22}
              color={draft.trim() ? colors.textInv : colors.text2}
              strokeWidth={2.4}
            />
          </Pressable>
        </View>

        {/* Quick add */}
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
          Quick add
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_ADD.filter((q) => !itemNames.has(q)).map((q) => (
            <Pressable
              key={q}
              onPress={() => onAdd(q)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: radius.full,
                // `surface` contrasts more crisply with `bg` than `surface2`
                // (which is nearly indistinguishable from page bg in light mode).
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.borderHi,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 16 }}>{foodEmoji(q)}</Text>
              <Text style={[type.body, { color: colors.text, fontWeight: '500' }]}>{q}</Text>
            </Pressable>
          ))}
        </View>

        {/* In pantry */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text2,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          In your pantry · {items.length}
        </Text>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : items.length === 0 ? (
          <Text style={[type.body, { color: colors.text3 }]}>
            Nothing yet. Tap something above.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => removeItem.mutate(item.id)}
                accessibilityLabel={`Remove ${item.ingredient}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingLeft: 12,
                  paddingRight: 6,
                  paddingVertical: 9,
                  borderRadius: radius.full,
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ fontSize: 15 }}>{foodEmoji(item.ingredient)}</Text>
                <Text
                  style={{
                    ...type.bodySm,
                    color: colors.textInv,
                    fontWeight: '700',
                  }}
                >
                  {item.ingredient}
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: 'rgba(0,0,0,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={13} color={colors.textInv} strokeWidth={3} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Filters */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Filters
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIME_FILTERS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={filters.maxMinutes === t.value}
              onPress={() => toggleTime(t.value)}
            />
          ))}
          <Chip
            label="High protein"
            selected={!!filters.highProtein}
            onPress={() => toggle('highProtein')}
          />
          <Chip label="Low carb" selected={!!filters.lowCarb} onPress={() => toggle('lowCarb')} />
          <Chip
            label="Vegetarian"
            selected={!!filters.vegetarian}
            onPress={() => toggle('vegetarian')}
          />
        </View>

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
          label="Generate recipe"
          size="lg"
          onPress={() => generate.mutate(filters)}
          disabled={!canGenerate}
          loading={generate.isPending}
        />
      </View>

      {generate.isPending ? <RecipeProcessingOverlay /> : null}
    </KeyboardAvoidingView>
  );
}
