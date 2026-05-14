import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, motion, type } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const HEIGHTS: Record<Size, number> = { sm: 32, md: 44, lg: 52 };

export function Button(props: ButtonProps) {
  const {
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
  } = props;
  const pressed = useSharedValue(0);

  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surface2
        : 'transparent';
  const fg =
    variant === 'primary' ? colors.textInv : variant === 'ghost' ? colors.text2 : colors.text;

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
    opacity: disabled || loading ? 0.5 : 1,
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => {
          pressed.value = withSpring(1, motion.snappy);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, motion.snappy);
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          height: HEIGHTS[size],
          backgroundColor: bg,
          borderRadius: 14,
          paddingHorizontal: size === 'lg' ? 24 : 18,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <ActivityIndicator color={fg} size="small" />
          ) : (
            <>
              {leftIcon}
              <Text
                style={{
                  ...type.label,
                  color: fg,
                  fontSize: size === 'lg' ? 16 : 14,
                  letterSpacing: 0.2,
                }}
              >
                {label}
              </Text>
              {rightIcon}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
