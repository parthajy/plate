import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, type } from '../../lib/theme';

// Rotating playful status messages. Cycle is faster than the actual scan
// so the user never sits on the same line for long.
const MESSAGES = [
  'Sharpening the knife…',
  'Counting the calories…',
  'Asking the chef…',
  'Squinting at the protein…',
  'Negotiating with the carbs…',
  'Weighing things in my head…',
  'Cross-referencing the cookbook…',
  'Doing the macro math…',
  'Sniffing the photo…',
];

const MESSAGE_MS = 1400;

export function ProcessingOverlay({ photoUri }: { photoUri: string | null }) {
  const pulse = useSharedValue(0);
  const progress = useSharedValue(0);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    progress.value = withTiming(0.92, { duration: 8000, easing: Easing.out(Easing.cubic) });
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), MESSAGE_MS);
    return () => clearInterval(t);
  }, [pulse, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    opacity: 0.55 + pulse.value * 0.35,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 240,
          height: 240,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: radius.xl,
              borderWidth: 2,
              borderColor: colors.accent,
            },
            ringStyle,
          ]}
        />
        {photoUri ? (
          <View
            style={{
              width: 216,
              height: 216,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: colors.surface,
            }}
          >
            <Animated.Image
              source={{ uri: photoUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityLabel="Captured food"
            />
          </View>
        ) : (
          <View
            style={{
              width: 216,
              height: 216,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
            }}
          />
        )}
      </View>

      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginTop: 48,
        }}
      >
        Scanning
      </Text>

      <Text
        style={{
          ...type.display3,
          color: colors.text,
          textAlign: 'center',
          marginTop: 10,
          maxWidth: 320,
        }}
        accessibilityLiveRegion="polite"
      >
        {MESSAGES[idx]}
      </Text>

      <View
        style={{
          marginTop: 28,
          width: 220,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.surface2,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={[{ height: '100%', backgroundColor: colors.accent }, barStyle]} />
      </View>
    </View>
  );
}
