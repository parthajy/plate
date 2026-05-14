import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { colors, type } from '../../lib/theme';

export default function Welcome() {
  const router = useRouter();

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
              Plate · for people who actually move
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <Text
              style={{
                ...type.display1,
                color: colors.text,
                marginTop: 18,
                fontSize: 52,
                lineHeight: 54,
              }}
            >
              Eat <Text style={{ color: colors.accent, fontStyle: 'italic' }}>smart</Text>.{'\n'}
              Train hard.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(380)}>
            <Text style={{ ...type.bodyLg, color: colors.text2, marginTop: 16, maxWidth: 320 }}>
              Three-second logging, an AI coach who knows your goals, and the food scan that finally
              works.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(560)} style={{ gap: 12 }}>
          <Button label="Create account" size="lg" onPress={() => router.push('/(auth)/signup')} />
          <Link href="/(auth)/login" asChild>
            <Text
              style={{
                ...type.body,
                color: colors.text2,
                textAlign: 'center',
                paddingVertical: 14,
              }}
            >
              I already have an account
            </Text>
          </Link>
        </Animated.View>
      </View>
    </Screen>
  );
}
