import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { Goal } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../stores/auth';
import { ApiError } from '../../lib/api';
import { colors, radius, type } from '../../lib/theme';

interface GoalOpt {
  value: Goal;
  label: string;
  blurb: string;
}

const GOALS: GoalOpt[] = [
  { value: 'lose', label: 'Lose', blurb: 'Drop body fat at a manageable pace' },
  { value: 'maintain', label: 'Maintain', blurb: 'Hold steady, eat to perform' },
  { value: 'gain', label: 'Gain', blurb: 'Build muscle, accept some fat gain' },
  { value: 'recomp', label: 'Recomp', blurb: 'Small deficit, prioritize protein and training' },
];

const RATES = [0.25, 0.5, 0.75, 1.0];

export default function GoalEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);

  const [goal, setGoal] = useState<Goal>((user?.goal as Goal) ?? 'maintain');
  const [rate, setRate] = useState<number>(0.5);
  const [saving, setSaving] = useState(false);

  const showsRate = useMemo(() => goal === 'lose' || goal === 'gain', [goal]);
  const valid = !showsRate || (rate > 0 && rate <= 1.5);

  const onSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await updateProfile({
        goal,
        goalRateKgPerWeek: showsRate ? rate : 0,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 6 }}>
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
          Goal
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[type.display2, { color: colors.text }]}>
          What are you <Text style={{ color: colors.accent, fontStyle: 'italic' }}>aiming for</Text>
          ?
        </Text>
        <Text style={[type.body, { color: colors.text3, marginTop: 8 }]}>
          Saving recomputes your daily kcal and macros.
        </Text>

        <View style={{ marginTop: 22, gap: 10 }}>
          {GOALS.map((opt) => {
            const selected = goal === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setGoal(opt.value)}
                style={{
                  padding: 16,
                  borderRadius: radius.lg,
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.border,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text
                  style={{
                    ...type.label,
                    fontSize: 16,
                    color: selected ? colors.textInv : colors.text,
                  }}
                >
                  {opt.label}
                </Text>
                <Text
                  style={{
                    ...type.bodySm,
                    color: selected ? colors.textInv : colors.text3,
                    marginTop: 4,
                  }}
                >
                  {opt.blurb}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showsRate ? (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.text3,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Weekly rate
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RATES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRate(r)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radius.full,
                    backgroundColor: rate === r ? colors.accent : colors.surface2,
                    borderWidth: 1,
                    borderColor: rate === r ? colors.accent : colors.border,
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: rate === r }}
                >
                  <Text
                    style={{
                      ...type.label,
                      color: rate === r ? colors.textInv : colors.text,
                    }}
                  >
                    {r.toFixed(2)} kg/wk
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[type.bodySm, { color: colors.text3, marginTop: 8 }]}>
              0.5 kg/wk is a sustainable default for most people.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom + 14,
          backgroundColor: colors.bg,
        }}
      >
        <Button
          label="Save and recompute"
          size="lg"
          disabled={!valid}
          loading={saving}
          onPress={() => void onSave()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
