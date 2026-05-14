import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Sex } from '@plate/shared';
import { Input } from '../../components/ui/Input';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors, radius, type } from '../../lib/theme';

const OPTIONS: { value: Sex; label: string }[] = [
  { value: 'm', label: 'Male' },
  { value: 'f', label: 'Female' },
  { value: 'x', label: 'Other' },
];

export default function SexScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const [sex, setSex] = useState<Sex | undefined>(draft.sex);
  const [birthdate, setBirthdate] = useState<string>(draft.birthdate ?? '');
  const valid = !!sex && /^\d{4}-\d{2}-\d{2}$/.test(birthdate);

  return (
    <OnboardingShell
      step={1}
      total={6}
      eyebrow="Step 1 of 6"
      title={
        <>
          A bit <Text style={{ color: colors.accent, fontStyle: 'italic' }}>about you</Text>.
        </>
      }
      subtitle="We use this to calculate your resting metabolic rate."
      primaryDisabled={!valid}
      onPrimary={() => {
        if (!sex) return;
        draft.set({ sex, birthdate });
        router.push('/(onboarding)/measurements');
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSex(opt.value)}
            style={{
              flex: 1,
              height: 64,
              borderRadius: radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: sex === opt.value ? colors.accent : colors.surface,
              borderWidth: 1,
              borderColor: sex === opt.value ? colors.accent : colors.border,
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: sex === opt.value }}
          >
            <Text
              style={{
                ...type.label,
                fontSize: 15,
                color: sex === opt.value ? colors.textInv : colors.text,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 24 }}>
        <Input
          label="Birthdate"
          value={birthdate}
          onChangeText={setBirthdate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          hint="Used only for age in the BMR calculation."
        />
      </View>
    </OnboardingShell>
  );
}
