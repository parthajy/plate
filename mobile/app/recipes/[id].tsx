import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { SavedRecipeResponse } from '@plate/shared';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { api } from '../../lib/api';
import { colors, type } from '../../lib/theme';

export default function RecipeDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pantry', 'recipes', 'detail', id],
    queryFn: () => api.get<SavedRecipeResponse>(`/v1/pantry/recipes/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : isError || !data ? (
          <Text style={[type.body, { color: colors.text2, marginTop: 40, textAlign: 'center' }]}>
            Couldn't load this recipe.
          </Text>
        ) : (
          <RecipeCard recipe={data.recipe} />
        )}
      </ScrollView>
    </View>
  );
}
