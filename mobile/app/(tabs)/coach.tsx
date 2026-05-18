import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ArrowUp } from 'lucide-react-native';
import type { CoachListResponse, CoachMessage, CoachSendResponse } from '@plate/shared';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, radius, type } from '../../lib/theme';

const SUGGESTIONS = [
  'How am I doing today?',
  'What should I eat right now?',
  'Quick high-protein snack?',
  "I'm under on protein — fix it.",
];

export default function CoachTab() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coach', 'messages'],
    queryFn: () => api.get<CoachListResponse>('/v1/coach/messages'),
    staleTime: 30_000,
  });

  const send = useMutation({
    mutationFn: (content: string) => api.post<CoachSendResponse>('/v1/coach/messages', { content }),
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['coach', 'messages'] });
      const prev = queryClient.getQueryData<CoachListResponse>(['coach', 'messages']);
      const optimistic: CoachMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<CoachListResponse>(['coach', 'messages'], (curr) => ({
        messages: [...(curr?.messages ?? []), optimistic],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['coach', 'messages'], ctx.prev);
    },
    onSuccess: (resp) => {
      queryClient.setQueryData<CoachListResponse>(['coach', 'messages'], (curr) => {
        const filtered = curr?.messages.filter((m) => !m.id.startsWith('optimistic-')) ?? [];
        return { messages: [...filtered, resp.user, resp.assistant] };
      });
    },
  });

  const onSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setDraft('');
      send.mutate(trimmed);
    },
    [send],
  );

  const messages = data?.messages ?? [];

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length, send.isPending]);

  const empty = messages.length === 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // Sit the input flush above the keyboard. The tab bar gets pushed up
      // with the keyboard, so we subtract its height from the avoidance.
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
    >
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Your coach
        </Text>
        <Text style={[type.display2, { color: colors.text, marginTop: 4 }]}>
          <Text style={{ color: colors.accent, fontStyle: 'italic' }}>Kai</Text>
          {user?.displayName ? `, with ${user.displayName}` : ''}.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          gap: 10,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={{ paddingTop: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}

        {empty ? (
          <View
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={[type.body, { color: colors.text }]}>
              Hey{user?.displayName ? `, ${user.displayName}` : ''}. I&apos;m Kai — your coach
              inside Plate. I see your daily targets, what you&apos;ve logged today, and your goal.
              Ask me anything.
            </Text>
          </View>
        ) : null}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}

        {send.isPending ? (
          <View style={{ gap: 8 }}>
            <TypingDots />
            <KaiThinkingLine />
          </View>
        ) : null}

        {send.isError ? (
          <View
            style={{
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: 'rgba(255,90,90,0.16)',
              borderWidth: 1,
              borderColor: colors.danger,
            }}
          >
            <Text style={[type.bodySm, { color: colors.text }]}>
              {send.error instanceof ApiError
                ? send.error.message
                : 'Kai is offline right now. Try again.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {empty ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => onSend(s)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: radius.full,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.bodySm, { color: colors.text }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: colors.bg,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface2,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 18,
            paddingVertical: 6,
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask Kai…"
            placeholderTextColor={colors.text3}
            multiline
            style={{
              ...type.body,
              color: colors.text,
              maxHeight: 120,
              minHeight: 32,
              paddingTop: 8,
              paddingBottom: 8,
            }}
            onSubmitEditing={() => onSend(draft)}
            blurOnSubmit={false}
          />
        </View>
        <Pressable
          onPress={() => onSend(draft)}
          disabled={!draft.trim() || send.isPending}
          accessibilityLabel="Send to Kai"
          hitSlop={6}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          {(() => {
            const active = !!draft.trim() && !send.isPending;
            return (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // bg/borderRadius MUST live on inner View — the same
                  // Pressable style-function bug that ate the chip backgrounds.
                  backgroundColor: active ? colors.accent : colors.surface,
                  borderWidth: 1.5,
                  borderColor: active ? colors.accent : colors.borderHi,
                }}
              >
                {send.isPending ? (
                  <ActivityIndicator color={colors.text2} size="small" />
                ) : (
                  <ArrowUp
                    size={22}
                    color={active ? colors.textInv : colors.text2}
                    strokeWidth={2.8}
                  />
                )}
              </View>
            );
          })()}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.lg,
        backgroundColor: isUser ? colors.accent : colors.surface,
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          ...type.body,
          color: isUser ? colors.textInv : colors.text,
        }}
      >
        {content}
      </Text>
    </View>
  );
}

const THINKING_LINES = [
  'Thinking through your day…',
  'Reading your training log…',
  'Doing the macro math…',
  'Checking what you ate…',
  'Considering your goal…',
  'Cross-referencing yesterday…',
  'Picking the right move…',
];
const THINKING_MS = 1600;

function KaiThinkingLine() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_LINES.length), THINKING_MS);
    return () => clearInterval(t);
  }, []);
  return (
    <Text
      style={{
        ...type.bodySm,
        color: colors.text3,
        fontStyle: 'italic',
        marginLeft: 6,
      }}
      accessibilityLiveRegion="polite"
    >
      {THINKING_LINES[idx]}
    </Text>
  );
}

function TypingDots() {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
      }}
      accessibilityLabel="Kai is typing"
    >
      <Dot delay={0} />
      <Dot delay={160} />
      <Dot delay={320} />
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 360, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 360, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Scale from 0.75 → 1.1, lift up to -4px at peak.
    const scale = 0.75 + 0.35 * progress.value;
    const translateY = -4 * progress.value;
    return {
      transform: [{ translateY }, { scale }],
      opacity: 0.55 + 0.45 * progress.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.accent,
        },
        animatedStyle,
      ]}
    />
  );
}
