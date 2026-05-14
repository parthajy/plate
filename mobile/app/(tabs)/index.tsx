import { Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors, type } from '../../lib/theme';

export default function Today() {
  return (
    <Screen>
      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        Today · placeholder
      </Text>
      <Text style={{ ...type.display2, color: colors.text, marginTop: 12 }}>
        Your <Text style={{ color: colors.accent, fontStyle: 'italic' }}>day</Text>.
      </Text>
      <View style={{ marginTop: 16 }}>
        <Text style={{ ...type.body, color: colors.text2 }}>
          Calorie ring + macro bars + meal list land here in the next commit.
        </Text>
      </View>
    </Screen>
  );
}
