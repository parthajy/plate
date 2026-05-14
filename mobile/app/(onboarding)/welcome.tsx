import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function OnboardingWelcome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.text3,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Six quick questions
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(220)}>
            <Text
              style={{
                ...type.display1,
                color: colors.text,
                marginTop: 16,
                fontSize: 44,
                lineHeight: 48,
              }}
            >
              Hi{user?.displayName ? `, ${user.displayName}` : ''}.{' '}
              <Text style={{ color: colors.accent, fontStyle: 'italic' }}>
                Let's set your targets
              </Text>
              .
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(380)}>
            <Text style={{ ...type.bodyLg, color: colors.text2, marginTop: 16 }}>
              No fluff. We use what you tell us to calculate a calorie + macro target you can
              actually hit.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(560)}>
          <Button label="Let's go" size="lg" onPress={() => router.push('/(onboarding)/sex')} />
        </Animated.View>
      </View>
    </Screen>
  );
}
