import { Text } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors, type } from '../../lib/theme';

export default function ScanTab() {
  return (
    <Screen>
      <Text style={{ ...type.display2, color: colors.text }}>
        Point. <Text style={{ color: colors.accent, fontStyle: 'italic' }}>Done</Text>.
      </Text>
      <Text style={{ ...type.body, color: colors.text2, marginTop: 8 }}>
        Vision scan ships in Phase 2.
      </Text>
    </Screen>
  );
}
