import { Text } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors, type } from '../../lib/theme';

export default function WorkoutsTab() {
  return (
    <Screen>
      <Text style={{ ...type.display2, color: colors.text }}>Workouts.</Text>
      <Text style={{ ...type.body, color: colors.text2, marginTop: 8 }}>
        Logging lands in Phase 3.
      </Text>
    </Screen>
  );
}
