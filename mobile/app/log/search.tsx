import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Search, X, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { colors, radius, type } from '../../lib/theme';

interface FoodHit {
  id: string;
  name: string;
  brand: string | null;
  servingG: string | null;
  kcalPer100g: string | null;
  proteinPer100g: string | null;
  carbsPer100g: string | null;
  fatPer100g: string | null;
}

interface SearchResponse {
  items: FoodHit[];
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery({
    queryKey: ['food', 'search', debounced],
    queryFn: () =>
      api.get<SearchResponse>(`/v1/food/search?q=${encodeURIComponent(debounced)}&limit=30`),
    enabled: debounced.length >= 1,
    staleTime: 60_000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={[type.label, { color: colors.text2, letterSpacing: 1 }]}>LOG A FOOD</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
            <X color={colors.text2} size={22} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.surface2,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Search color={colors.text3} size={18} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search foods…"
            placeholderTextColor={colors.text3}
            style={{ ...type.body, color: colors.text, flex: 1 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ('')} hitSlop={6}>
              <X color={colors.text3} size={16} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {debounced.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ ...type.body, color: colors.text3 }}>
            Try “chicken”, “oats”, “salmon”…
          </Text>
        </View>
      ) : isFetching && !data ? (
        <View style={{ paddingTop: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : data && data.items.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={[type.body, { color: colors.text2 }]}>No matches for “{debounced}”.</Text>
          <Pressable
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
            onPress={() =>
              router.push({
                pathname: '/log/portion',
                params: { name: debounced, custom: '1' },
              })
            }
          >
            <Plus color={colors.accent} size={18} strokeWidth={2.5} />
            <Text style={{ ...type.label, color: colors.text }}>
              Log “{debounced}” as a custom entry
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          estimatedItemSize={68}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/log/portion',
                  params: { foodId: item.id, name: item.name },
                })
              }
              style={{
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={[type.body, { color: colors.text }]}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Text style={[type.monoSm, { color: colors.text3, letterSpacing: 1 }]}>
                  {Math.round(Number(item.kcalPer100g ?? 0))} KCAL ·{' '}
                  {Math.round(Number(item.proteinPer100g ?? 0))}G P · per 100g
                </Text>
                {item.brand ? (
                  <Text style={[type.monoSm, { color: colors.text3 }]}>· {item.brand}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
