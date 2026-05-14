import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Goal } from '@plate/shared';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors, radius, type } from '../../lib/theme';

const OPTIONS: { value: Goal; title: string; desc: string }[] = [
  { value: 'lose', title: 'Lose fat', desc: 'Slight calorie deficit, protein up.' },
  { value: 'maintain', title: 'Maintain', desc: "Eat to match what you're doing." },
  { value: 'gain', title: 'Gain muscle', desc: 'Small surplus, plenty of protein.' },
  { value: 'recomp', title: 'Recomp', desc: 'Body composition — lift, not starve.' },
];

export default function GoalScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const [goal, setGoal] = useState<Goal | undefined>(draft.goal ?? 'recomp');

  return (
    <OnboardingShell
      step={4}
      total={6}
      eyebrow="Step 4 of 6"
      title={
        <>
          What's the <Text style={{ color: colors.accent, fontStyle: 'italic' }}>goal</Text>?
        </>
      }
      primaryDisabled={!goal}
      onPrimary={() => {
        if (!goal) return;
        draft.set({ goal });
        router.push('/(onboarding)/rate');
      }}
    >
      <View style={{ gap: 10 }}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => setGoal(o.value)}
            style={{
              padding: 16,
              borderRadius: radius.lg,
              backgroundColor: goal === o.value ? colors.surface : colors.bgWarm,
              borderWidth: 1,
              borderColor: goal === o.value ? colors.accent : colors.border,
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: goal === o.value }}
          >
            <Text style={{ ...type.label, fontSize: 16, color: colors.text }}>{o.title}</Text>
            <Text style={{ ...type.body, color: colors.text2, marginTop: 4 }}>{o.desc}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingShell>
  );
}
