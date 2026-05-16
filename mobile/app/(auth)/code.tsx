import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Check, ChevronLeft } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, radius, type } from '../../lib/theme';

const LENGTH = 6;
const RESEND_COOLDOWN_S = 30;

export default function CodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const requestOtp = useAuth((s) => s.requestOtp);

  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resentAt, setResentAt] = useState<number>(Date.now());
  const inputRef = useRef<TextInput | null>(null);
  const shake = useSharedValue(0);

  // Cooldown so users can't spam the resend button.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const cooldown = Math.max(0, RESEND_COOLDOWN_S - Math.floor((now - resentAt) / 1000));

  useEffect(() => {
    if (code.length === LENGTH && !busy) void onSubmit(code);
    // Intentionally only depends on `code` — auto-submitting once the
    // user finishes typing. Adding busy/onSubmit would cause re-submits.
  }, [code]);

  const triggerShake = () => {
    shake.value = withSequence(
      withTiming(-8, { duration: 60, easing: Easing.linear }),
      withTiming(8, { duration: 60, easing: Easing.linear }),
      withTiming(-6, { duration: 60, easing: Easing.linear }),
      withTiming(6, { duration: 60, easing: Easing.linear }),
      withTiming(0, { duration: 60, easing: Easing.linear }),
    );
  };

  const boxesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const onSubmit = async (value: string) => {
    if (value.length !== LENGTH || busy) return;
    setErr(null);
    setBusy(true);
    try {
      await verifyOtp(email, value);
      setSuccess(true);
      setTimeout(() => router.replace('/'), 400);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not verify the code. Try again.');
      setCode('');
      triggerShake();
      setTimeout(() => inputRef.current?.focus(), 60);
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    setErr(null);
    try {
      await requestOtp(email);
      setResentAt(Date.now());
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not resend. Try again.');
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
          Step 2 of 2
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
          Check your <Text style={{ color: colors.accent, fontStyle: 'italic' }}>email</Text>.
        </Text>
        <Text style={{ ...type.bodyLg, color: colors.text2, marginTop: 12 }}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.text, fontWeight: '500' }}>{email}</Text>
        </Text>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={{ marginTop: 36 }}
          accessibilityLabel="Enter 6-digit code"
        >
          <Animated.View
            style={[{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }, boxesStyle]}
          >
            {Array.from({ length: LENGTH }).map((_, i) => (
              <CodeBox
                key={i}
                char={code[i] ?? ''}
                focused={i === code.length}
                error={!!err}
                success={success}
              />
            ))}
          </Animated.View>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => {
              setErr(null);
              setCode(v.replace(/[^0-9]/g, '').slice(0, LENGTH));
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus
            maxLength={LENGTH}
            // Invisible input that backs the visual boxes — opaque tap target
            // makes paste-from-clipboard work on iOS via the long-press menu.
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 70,
              opacity: 0,
              color: 'transparent',
              fontSize: 1,
            }}
          />
        </Pressable>

        {err ? (
          <Text
            style={{
              ...type.bodySm,
              color: colors.danger,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {err}
          </Text>
        ) : null}

        <View style={{ marginTop: 28, gap: 12 }}>
          <Button
            label={success ? 'Welcome' : 'Verify'}
            size="lg"
            loading={busy && !success}
            disabled={code.length !== LENGTH && !success}
            onPress={() => void onSubmit(code)}
            leftIcon={
              success ? <Check size={18} color={colors.textInv} strokeWidth={2.6} /> : undefined
            }
          />
          <Pressable onPress={() => void onResend()} disabled={cooldown > 0} hitSlop={8}>
            <Text
              style={{
                ...type.body,
                textAlign: 'center',
                paddingVertical: 10,
                color: cooldown > 0 ? colors.text3 : colors.accent,
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}

function CodeBox({
  char,
  focused,
  error,
  success,
}: {
  char: string;
  focused: boolean;
  error: boolean;
  success: boolean;
}) {
  const cursor = useSharedValue(0);

  useEffect(() => {
    if (focused && !char && !success) {
      cursor.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 480, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      cursor.value = 0;
    }
  }, [focused, char, success, cursor]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursor.value,
  }));

  const borderColor = error
    ? colors.danger
    : success
      ? colors.accent
      : focused
        ? colors.accent
        : char
          ? colors.borderHi
          : colors.border;

  return (
    <View
      style={{
        flex: 1,
        height: 64,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: char || success ? colors.surface2 : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {char ? (
        <Text
          style={{
            fontSize: 28,
            fontWeight: '500',
            color: colors.text,
            letterSpacing: 0.5,
          }}
        >
          {char}
        </Text>
      ) : focused ? (
        <Animated.View
          style={[
            {
              width: 2,
              height: 26,
              borderRadius: 1,
              backgroundColor: colors.accent,
            },
            cursorStyle,
          ]}
        />
      ) : null}
    </View>
  );
}
