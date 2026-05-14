import { Pressable, Text, View } from 'react-native';
import { format } from 'date-fns';
import { colors, type } from '../../lib/theme';

export interface MealRowEntry {
  id: string;
  name: string;
  brand?: string | null;
  grams: number;
  kcal: number;
  loggedAt: string;
  mealType?: string | null;
}

interface MealRowProps {
  entry: MealRowEntry;
  onPress?: () => void;
}

export function MealRow({ entry, onPress }: MealRowProps) {
  const meal = entry.mealType ?? 'snack';
  const time = format(new Date(entry.loggedAt), 'h:mm a').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[type.display3, { color: colors.text2, fontSize: 14 }]}>
          {meal.slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ ...type.body, color: colors.text }}>
          {entry.name}
        </Text>
        <Text style={{ ...type.monoSm, color: colors.text3, letterSpacing: 1, marginTop: 2 }}>
          {meal.toUpperCase()} · {time} · {Math.round(entry.grams)}G
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.display3, { color: colors.text, fontSize: 17 }]}>
          {Math.round(entry.kcal)}
          <Text style={{ ...type.bodySm, color: colors.text3 }}> kcal</Text>
        </Text>
      </View>
    </Pressable>
  );
}
