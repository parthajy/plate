import { Pressable, Text } from 'react-native';
import { colors, type } from '../../lib/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: selected ? colors.accent : colors.surface2,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon}
      <Text
        style={{
          ...type.label,
          color: selected ? colors.textInv : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
