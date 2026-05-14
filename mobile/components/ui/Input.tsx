import { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, type } from '../../lib/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | undefined;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(props, ref) {
  const { label, error, hint, ...rest } = props;
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ width: '100%' }}>
      {label ? (
        <Text
          style={{
            ...type.labelSm,
            color: colors.text3,
            letterSpacing: 1.2,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.text3}
        selectionColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={{
          ...type.body,
          color: colors.text,
          height: 48,
          backgroundColor: colors.surface2,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : focused ? colors.accent : colors.border,
          paddingHorizontal: 14,
        }}
        {...rest}
      />
      {error ? (
        <Text style={{ ...type.bodySm, color: colors.danger, marginTop: 6 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ ...type.bodySm, color: colors.text3, marginTop: 6 }}>{hint}</Text>
      ) : null}
    </View>
  );
});
