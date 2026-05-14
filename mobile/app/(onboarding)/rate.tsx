import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors, radius, type } from '../../lib/theme';

// Pickable rates depend on the chosen goal.
function ratesFor(goal: string | undefined): { value: number; label: string; hint?: string }[] {
  switch (goal) {
    case 'lose':
      return [
        { value: 0.25, label: 'Easy', hint: '0.25 kg / week' },
        { value: 0.5, label: 'Steady', hint: '0.5 kg / week' },
        { value: 0.75, label: 'Aggressive', hint: '0.75 kg / week' },
      ];
    case 'gain':
      return [
        { value: 0.25, label: 'Lean', hint: '0.25 kg / week' },
        { value: 0.5, label: 'Standard', hint: '0.5 kg / week' },
      ];
    case 'recomp':
      return [{ value: 0, label: 'Steady', hint: 'Slow + sustainable' }];
    case 'maintain':
    default:
      return [{ value: 0, label: 'Hold', hint: 'No change' }];
  }
}

export default function RateScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const options = useMemo(() => ratesFor(draft.goal), [draft.goal]);
  const [rate, setRate] = useState<number>(
    draft.goalRateKgPerWeek ?? options[Math.min(1, options.length - 1)]?.value ?? 0,
  );

  return (
    <OnboardingShell
      step={5}
      total={6}
      eyebrow="Step 5 of 6"
      title={
        <>
          How <Text style={{ color: colors.accent, fontStyle: 'italic' }}>fast</Text>?
        </>
      }
      subtitle="Faster isn't better. Sustainable beats aggressive every time."
      onPrimary={() => {
        draft.set({ goalRateKgPerWeek: rate });
        router.push('/(onboarding)/targets');
      }}
    >
      <View style={{ gap: 10 }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => setRate(o.value)}
            style={{
              padding: 16,
              borderRadius: radius.lg,
              backgroundColor: rate === o.value ? colors.surface : colors.bgWarm,
              borderWidth: 1,
              borderColor: rate === o.value ? colors.accent : colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: rate === o.value }}
          >
            <View>
              <Text style={{ ...type.label, fontSize: 16, color: colors.text }}>{o.label}</Text>
              {o.hint ? (
                <Text style={{ ...type.body, color: colors.text2, marginTop: 4 }}>{o.hint}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </OnboardingShell>
  );
}
