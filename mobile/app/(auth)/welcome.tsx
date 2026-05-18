import { useRouter } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { GoogleGIcon } from '../../components/ui/GoogleGIcon';
import { Screen } from '../../components/ui/Screen';
import { PulseLine } from '../../components/ui/PulseLine';
import { useAppleSignIn } from '../../hooks/useAppleSignIn';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { colors, type } from '../../lib/theme';

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

        <Animated.View entering={FadeInDown.duration(500).delay(560)} style={{ gap: 14 }}>
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
                marginVertical: 2,
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

          {/* Icon-only sign-in buttons. Apple uses the U+F8FF Apple-logo
              glyph rendered by iOS's system font — works on iPhone/iPad
              builds; on other platforms the AppleAuth flow is gated by
              `apple.available && Platform.OS === 'ios'` so the glyph never
              renders without iOS font support. */}
          {(apple.available && Platform.OS === 'ios') || google.available ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 18,
                paddingVertical: 4,
              }}
            >
              {apple.available && Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => void apple.signIn()}
                  disabled={apple.inFlight}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                  hitSlop={6}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: '#000000',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: apple.inFlight ? 0.5 : 1,
                    }}
                  >
                    {apple.inFlight ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: '#ffffff',
                          fontSize: 32,
                          lineHeight: 36,
                          marginTop: -2,
                        }}
                      >
                        {''}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ) : null}

              {google.available ? (
                <Pressable
                  onPress={() => void google.signIn()}
                  disabled={google.inFlight}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                  hitSlop={6}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: '#ffffff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.borderHi,
                      opacity: google.inFlight ? 0.5 : 1,
                    }}
                  >
                    {google.inFlight ? (
                      <ActivityIndicator color="#1f1f1f" size="small" />
                    ) : (
                      <GoogleGIcon size={28} />
                    )}
                  </View>
                </Pressable>
              ) : null}
            </View>
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
