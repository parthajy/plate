import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { SignupSchema, type SignupInput } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuth((s) => s.signUp);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);
    try {
      await signUp(values.email, values.password, values.displayName);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) setSubmitErr(err.message);
      else setSubmitErr('Could not sign you up. Please try again.');
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
          Make it <Text style={{ color: colors.accent, fontStyle: 'italic' }}>yours</Text>.
        </Text>
        <Text style={{ ...type.body, color: colors.text2, marginTop: 8 }}>
          A quick account, then we'll get to know you in 6 questions.
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
                placeholder="At least 8 characters"
                secureTextEntry
                returnKeyType="next"
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="displayName"
            render={({ field }) => (
              <Input
                label="Name"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="What should Kai call you?"
                returnKeyType="done"
                onSubmitEditing={() => void onSubmit()}
                error={errors.displayName?.message}
                hint="Optional"
              />
            )}
          />
        </View>

        {submitErr ? (
          <Text style={{ ...type.bodySm, color: colors.danger, marginTop: 16 }}>{submitErr}</Text>
        ) : null}

        <View style={{ marginTop: 28, gap: 12 }}>
          <Button
            label="Create account"
            size="lg"
            onPress={() => void onSubmit()}
            loading={isSubmitting}
          />
          <Link href="/(auth)/login" asChild>
            <Text
              style={{
                ...type.body,
                color: colors.text2,
                textAlign: 'center',
                paddingVertical: 12,
              }}
            >
              Already signed up? <Text style={{ color: colors.text }}>Log in</Text>
            </Text>
          </Link>
        </View>
      </Animated.View>
    </Screen>
  );
}
