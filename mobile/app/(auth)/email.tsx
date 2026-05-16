import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, type } from '../../lib/theme';

export default function EmailScreen() {
  const router = useRouter();
  const requestOtp = useAuth((s) => s.requestOtp);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const valid = /.+@.+\..+/.test(email.trim());

  const onSubmit = async () => {
    if (!valid || busy) return;
    setErr(null);
    setBusy(true);
    try {
      await requestOtp(email.trim());
      router.push({ pathname: '/(auth)/code', params: { email: email.trim() } });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send the code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard scroll>
      <Animated.View entering={FadeIn.duration(300)}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ marginBottom: 24 }}
          accessibilityLabel="Back"
        >
          <ChevronLeft color={colors.text2} size={26} />
        </Pressable>

        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Step 1 of 2
        </Text>
        <Text
          style={{
            ...type.display1,
            color: colors.text,
            marginTop: 8,
            fontSize: 38,
            lineHeight: 42,
          }}
        >
          What&apos;s your <Text style={{ color: colors.accent, fontStyle: 'italic' }}>email</Text>?
        </Text>
        <Text style={{ ...type.bodyLg, color: colors.text2, marginTop: 12, maxWidth: 320 }}>
          We&apos;ll send a 6-digit code. New here? Account gets created automatically.
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 32 }}>
          <View
            style={{
              borderBottomWidth: 2,
              borderBottomColor: err ? colors.danger : focused ? colors.accent : colors.borderHi,
              paddingBottom: 8,
            }}
          >
            <TextInput
              ref={inputRef}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={() => void onSubmit()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              selectionColor={colors.accent}
              style={{
                fontSize: 24,
                color: colors.text,
                paddingVertical: 4,
                letterSpacing: 0.2,
              }}
            />
          </View>
          {err ? (
            <Text style={{ ...type.bodySm, color: colors.danger, marginTop: 8 }}>{err}</Text>
          ) : null}
        </Pressable>

        <View style={{ marginTop: 28 }}>
          <Button
            label="Send code"
            size="lg"
            disabled={!valid}
            loading={busy}
            onPress={() => void onSubmit()}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            paddingHorizontal: 4,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ ...type.monoSm, color: colors.text3, letterSpacing: 1.2 }}>
            no passwords here
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
      </Animated.View>
    </Screen>
  );
}
