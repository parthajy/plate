import { useRouter } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '../../components/ui/Button';
import { GoogleSignInButton } from '../../components/ui/GoogleSignInButton';
import { Screen } from '../../components/ui/Screen';
import { PulseLine } from '../../components/ui/PulseLine';
import { useAppleSignIn } from '../../hooks/useAppleSignIn';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { colors, radius, type } from '../../lib/theme';

export default function Welcome() {
  const router = useRouter();
  const google = useGoogleSignIn();
  const apple = useAppleSignIn();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: 12 }}>
        <View style={{ marginTop: 24 }}>
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.text3,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
              }}
            >
              Plate · for people who actually move
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={{ marginTop: 22 }}>
            <PulseLine width={260} height={30} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(280)}>
            <Text
              style={{
                ...type.display1,
                color: colors.text,
                marginTop: 20,
                fontSize: 56,
                lineHeight: 58,
                letterSpacing: -1.5,
              }}
            >
              Eat <Text style={{ color: colors.accent, fontStyle: 'italic' }}>smart</Text>.{'\n'}
              Train hard.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(420)}>
            <Text
              style={{
                ...type.bodyLg,
                color: colors.text2,
                marginTop: 18,
                maxWidth: 320,
                lineHeight: 26,
              }}
            >
              Three-second logging, an AI coach who knows your goals, and the food scan that finally
              works.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(560)} style={{ gap: 12 }}>
          <Button
            label="Continue with email"
            size="lg"
            onPress={() => router.push('/(auth)/email')}
          />
          {google.available || apple.available ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginVertical: 4,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text
                style={{
                  ...type.monoSm,
                  color: colors.text3,
                  letterSpacing: 1.4,
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
          ) : null}
          {apple.available && Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={radius.md}
              style={{ height: 52 }}
              onPress={() => void apple.signIn()}
            />
          ) : null}
          {google.available ? (
            <GoogleSignInButton onPress={() => void google.signIn()} loading={google.inFlight} />
          ) : null}
          {apple.error || google.error ? (
            <Text style={{ ...type.bodySm, color: colors.danger, textAlign: 'center' }}>
              {apple.error ?? google.error}
            </Text>
          ) : (
            <Text
              style={{
                ...type.bodySm,
                color: colors.text3,
                textAlign: 'center',
                paddingTop: 2,
              }}
            >
              {google.available || apple.available
                ? 'No passwords either way.'
                : "We'll send a 6-digit code. No passwords."}
            </Text>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
