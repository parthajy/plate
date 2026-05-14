import { Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function YouTab() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

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
        Account
      </Text>
      <Text style={{ ...type.display2, color: colors.text, marginTop: 8 }}>
        {user?.displayName ?? 'You'}.
      </Text>
      <Text style={{ ...type.body, color: colors.text2, marginTop: 4 }}>{user?.email}</Text>

      <View style={{ marginTop: 'auto', gap: 12 }}>
        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
