import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, type } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
}

export function CalorieRing({ consumed, target, size = 220, stroke = 14 }: RingProps) {
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target;
  const headline = over ? `+${Math.round(consumed - target)}` : Math.round(remaining).toString();

  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [ratio, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const ringColor = over ? colors.warn : colors.accent;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface2}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {over ? 'Over' : 'Remaining'}
        </Text>
        <Text style={[type.display1, { color: over ? colors.warn : colors.text, marginTop: 4 }]}>
          {headline}
        </Text>
        <Text style={{ ...type.body, color: colors.text3, marginTop: 2 }}>
          {Math.round(consumed)} / {target} kcal
        </Text>
      </View>
    </View>
  );
}
