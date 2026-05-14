import { Text } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors, type } from '../../lib/theme';

export default function CoachTab() {
  return (
    <Screen>
      <Text style={{ ...type.display2, color: colors.text }}>
        <Text style={{ color: colors.accent, fontStyle: 'italic' }}>Kai</Text>.
      </Text>
      <Text style={{ ...type.body, color: colors.text2, marginTop: 8 }}>Coming in Phase 2.</Text>
    </Screen>
  );
}
