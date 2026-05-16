import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Heart-rate trace that draws itself across, holds briefly, then redraws.
 * No splash icon, no influencer aesthetic — a quiet signal that this is
 * about training, not lifestyle.
 */
export function PulseLine({
  width = 220,
  height = 30,
  color = colors.accent,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  // Path tuned so the spike sits ~60% in
  const path =
    `M0 ${height / 2} ` +
    `L ${width * 0.35} ${height / 2} ` +
    `L ${width * 0.42} ${height * 0.2} ` +
    `L ${width * 0.5} ${height * 0.85} ` +
    `L ${width * 0.58} ${height * 0.15} ` +
    `L ${width * 0.66} ${height / 2} ` +
    `L ${width} ${height / 2}`;

  const totalLen = width * 1.35; // generous overestimate; strokeDasharray covers it
  const draw = useSharedValue(0);

  useEffect(() => {
    draw.value = withRepeat(
      withDelay(100, withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) })),
      -1,
      false,
    );
  }, [draw]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: totalLen * (1 - draw.value),
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* baseline (faint) */}
        <Path
          d={`M0 ${height / 2} L${width} ${height / 2}`}
          stroke={colors.border}
          strokeWidth={1}
          fill="none"
        />
        <AnimatedPath
          d={path}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${totalLen} ${totalLen}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
