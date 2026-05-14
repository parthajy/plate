import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, type } from '../../lib/theme';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [ratio, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(2, progress.value * 100)}%`,
  }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
        <Text style={[type.display3, { color: colors.text, fontSize: 22 }]}>
          {Math.round(current)}
        </Text>
        <Text style={{ ...type.bodySm, color: colors.text3, marginLeft: 4 }}>
          / {target}
          {unit}
        </Text>
      </View>
      <View
        style={{
          width: '100%',
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.surface2,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[{ height: '100%', backgroundColor: color, borderRadius: 3 }, fillStyle]}
        />
      </View>
    </View>
  );
}
