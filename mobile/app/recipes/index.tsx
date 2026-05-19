import { useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { SavedRecipeListResponse } from '@plate/shared';
import { api } from '../../lib/api';
import { colors, radius, type } from '../../lib/theme';

export default function RecipesList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['pantry', 'recipes', 'list'],
    queryFn: () => api.get<SavedRecipeListResponse>('/v1/pantry/recipes'),
    staleTime: 60_000,
  });

  const recipes = data?.recipes ?? [];

  // Group by relative date band so the list reads like "Today / This week /
  // Earlier" — gives the user a sense of cadence without showing 100 dates.
  const sections = useMemo(() => groupByDate(recipes), [recipes]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 8,
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
          paddingBottom: insets.bottom + 32,
          paddingTop: 8,
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
            ...type.display1,
            color: colors.text,
            fontStyle: 'italic',
            fontSize: 38,
            lineHeight: 42,
          }}
        >
          Your recipes.
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
          {recipes.length} generated · tap to revisit
        </Text>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : recipes.length === 0 ? (
          <View
            style={{
              marginTop: 36,
              padding: 22,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
            }}
          >
            <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
              No recipes yet.
            </Text>
            <Text style={[type.bodySm, { color: colors.text3, marginTop: 6, textAlign: 'center' }]}>
              Generate one from your pantry and it'll live here.
            </Text>
            <View style={{ marginTop: 16 }}>
              <Pressable
                onPress={() => router.replace('/pantry')}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                  }}
                >
                  <Text style={{ ...type.label, color: colors.textInv, fontWeight: '700' }}>
                    Generate a recipe
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.label} style={{ marginTop: 22 }}>
              <Text
                style={{
                  ...type.monoSm,
                  color: colors.text3,
                  letterSpacing: 1.3,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {section.label}
              </Text>
              <View style={{ gap: 10 }}>
                {section.recipes.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push(`/recipes/${r.id}`)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <View
                      style={{
                        padding: 16,
                        borderRadius: radius.lg,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          ...type.display3,
                          color: colors.text,
                          fontStyle: 'italic',
                          fontSize: 20,
                          lineHeight: 24,
                        }}
                        numberOfLines={2}
                      >
                        {r.title}
                      </Text>
                      <Text
                        style={{
                          ...type.monoSm,
                          color: colors.text2,
                          letterSpacing: 1.2,
                          marginTop: 6,
                        }}
                      >
                        {r.totalMinutes} MIN · {Math.round(r.macrosPerServing.proteinG)}g·P ·{' '}
                        {Math.round(r.macrosPerServing.kcal)} KCAL
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function groupByDate(
  recipes: SavedRecipeListResponse['recipes'],
): { label: string; recipes: SavedRecipeListResponse['recipes'] }[] {
  const now = Date.now();
  const today: typeof recipes = [];
  const week: typeof recipes = [];
  const earlier: typeof recipes = [];
  for (const r of recipes) {
    const ageMs = now - new Date(r.createdAt).getTime();
    if (ageMs < 24 * 3600 * 1000) today.push(r);
    else if (ageMs < 7 * 24 * 3600 * 1000) week.push(r);
    else earlier.push(r);
  }
  return [
    today.length ? { label: 'Today', recipes: today } : null,
    week.length ? { label: 'This week', recipes: week } : null,
    earlier.length ? { label: 'Earlier', recipes: earlier } : null,
  ].filter((s): s is { label: string; recipes: typeof recipes } => s !== null);
}
