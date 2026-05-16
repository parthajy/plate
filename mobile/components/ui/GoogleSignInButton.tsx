import { ActivityIndicator, Pressable, Text } from 'react-native';
import { GoogleGIcon } from './GoogleGIcon';
import { radius, type } from '../../lib/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, loading, disabled }: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => ({
        height: 52,
        borderRadius: radius.md,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 24,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {loading ? (
        <ActivityIndicator color="#1f1f1f" size="small" />
      ) : (
        <>
          <GoogleGIcon size={20} />
          <Text
            style={{
              ...type.label,
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: '500',
              letterSpacing: 0.2,
            }}
          >
            Continue with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}
