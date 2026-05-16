import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ChefHat } from 'lucide-react-native';
import { colors, type } from '../../lib/theme';

// Playful rotating status lines while the recipe is being generated.
const MESSAGES = [
  'Calling the farmers…',
  'Asking the chef for ideas…',
  'Checking the spice cabinet…',
  'Bargaining with the broccoli…',
  'Doing the macro math…',
  'Reading old cookbooks…',
  'Sniffing the garlic…',
  'Negotiating with the protein…',
  'Tasting in my head…',
  'Plating it up…',
];

const MESSAGE_MS = 1400;

export function RecipeProcessingOverlay() {
  const pulse = useSharedValue(0);
  const progress = useSharedValue(0);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    progress.value = withTiming(0.92, { duration: 9000, easing: Easing.out(Easing.cubic) });
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), MESSAGE_MS);
    return () => clearInterval(t);
  }, [pulse, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.5 + pulse.value * 0.4,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        zIndex: 50,
      }}
    >
      <View
        style={{
          width: 160,
          height: 160,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 2,
              borderColor: colors.accent,
            },
            ringStyle,
          ]}
        />
        <View
          style={{
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChefHat size={56} color={colors.accent} strokeWidth={1.6} />
        </View>
      </View>

      <Text
        style={{
          ...type.monoSm,
          color: colors.text3,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginTop: 36,
        }}
      >
        Cooking up your recipe
      </Text>

      <Text
        style={{
          ...type.display3,
          color: colors.text,
          textAlign: 'center',
          marginTop: 10,
          maxWidth: 320,
          fontStyle: 'italic',
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
