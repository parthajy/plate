import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../../lib/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** padded with screen-default horizontal padding (20pt). */
  padded?: boolean;
  /** add bottom padding for keyboard avoidance + safe area. */
  keyboard?: boolean;
}

export function Screen({ children, scroll = false, padded = true, keyboard = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const horizontal = padded ? 20 : 0;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: horizontal,
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[5],
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        paddingHorizontal: horizontal,
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[5],
      }}
    >
      {children}
    </View>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>{content}</View>;
}
