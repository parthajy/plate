import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Input } from '../../components/ui/Input';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors } from '../../lib/theme';
import { Text } from 'react-native';

export default function MeasurementsScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const [heightCm, setHeight] = useState(draft.heightCm?.toString() ?? '');
  const [weightKg, setWeight] = useState(draft.weightKg?.toString() ?? '');

  const h = Number(heightCm);
  const w = Number(weightKg);
  const valid = h >= 80 && h <= 260 && w >= 25 && w <= 400;

  return (
    <OnboardingShell
      step={2}
      total={6}
      eyebrow="Step 2 of 6"
      title={
        <>
          Your <Text style={{ color: colors.accent, fontStyle: 'italic' }}>numbers</Text>.
        </>
      }
      subtitle="Metric for now. You can switch units in Settings."
      primaryDisabled={!valid}
      onPrimary={() => {
        draft.set({ heightCm: h, weightKg: w });
        router.push('/(onboarding)/activities');
      }}
    >
      <View style={{ gap: 16 }}>
        <Input
          label="Height (cm)"
          value={heightCm}
          onChangeText={setHeight}
          keyboardType="number-pad"
          placeholder="178"
        />
        <Input
          label="Weight (kg)"
          value={weightKg}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="74"
        />
      </View>
    </OnboardingShell>
  );
}
