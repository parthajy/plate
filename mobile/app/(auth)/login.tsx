import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { LoginSchema, type LoginInput } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);
    try {
      await signIn(values.email, values.password);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) setSubmitErr(err.message);
      else setSubmitErr('Could not log you in. Please try again.');
    }
  });

  return (
    <Screen keyboard scroll>
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <ChevronLeft
            color={colors.text2}
            size={24}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
        </View>
        <Text style={{ ...type.display2, color: colors.text }}>
          Welcome <Text style={{ color: colors.accent, fontStyle: 'italic' }}>back</Text>.
        </Text>

        <View style={{ gap: 16, marginTop: 32 }}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                label="Password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Your password"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={() => void onSubmit()}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        {submitErr ? (
          <Text style={{ ...type.bodySm, color: colors.danger, marginTop: 16 }}>{submitErr}</Text>
        ) : null}

        <View style={{ marginTop: 28, gap: 12 }}>
          <Button label="Log in" size="lg" onPress={() => void onSubmit()} loading={isSubmitting} />
          <Link href="/(auth)/signup" asChild>
            <Text
              style={{
                ...type.body,
                color: colors.text2,
                textAlign: 'center',
                paddingVertical: 12,
              }}
            >
              New here? <Text style={{ color: colors.text }}>Create an account</Text>
            </Text>
          </Link>
        </View>
      </Animated.View>
    </Screen>
  );
}
