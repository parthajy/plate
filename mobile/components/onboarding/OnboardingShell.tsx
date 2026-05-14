import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { colors, type } from '../../lib/theme';

interface ShellProps {
  step: number;
  total: number;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  primaryLoading?: boolean;
}

export function OnboardingShell(props: ShellProps) {
  const router = useRouter();

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        {props.step > 1 ? (
          <ChevronLeft
            color={colors.text2}
            size={24}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
        ) : (
          <View style={{ width: 24 }} />
        )}
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: props.total }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i + 1 === props.step ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i + 1 <= props.step ? colors.accent : colors.surface2,
              }}
            />
          ))}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <Animated.View entering={FadeIn.duration(280)}>
        {props.eyebrow ? (
          <Text
            style={{
              ...type.monoSm,
              color: colors.text3,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {props.eyebrow}
          </Text>
        ) : null}
        <Text style={{ ...type.display2, color: colors.text }}>{props.title}</Text>
        {props.subtitle ? (
          <Text style={{ ...type.body, color: colors.text2, marginTop: 10 }}>{props.subtitle}</Text>
        ) : null}

        <View style={{ marginTop: 32 }}>{props.children}</View>
      </Animated.View>

      <View style={{ marginTop: 32 }}>
        <Button
          label={props.primaryLabel ?? 'Continue'}
          size="lg"
          onPress={props.onPrimary}
          disabled={props.primaryDisabled ?? false}
          loading={props.primaryLoading ?? false}
        />
      </View>
    </Screen>
  );
}
