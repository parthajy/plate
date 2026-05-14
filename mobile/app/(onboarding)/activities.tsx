import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Dumbbell, Footprints, Bike, Waves, Trophy, Flower2 } from 'lucide-react-native';
import type { Activity } from '@plate/shared';
import { Chip } from '../../components/ui/Chip';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors } from '../../lib/theme';

const ALL: { value: Activity; label: string; Icon: typeof Dumbbell }[] = [
  { value: 'gym', label: 'Gym', Icon: Dumbbell },
  { value: 'run', label: 'Run', Icon: Footprints },
  { value: 'cycle', label: 'Cycle', Icon: Bike },
  { value: 'swim', label: 'Swim', Icon: Waves },
  { value: 'sports', label: 'Sports', Icon: Trophy },
  { value: 'yoga', label: 'Yoga', Icon: Flower2 },
];

export default function ActivitiesScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const [selected, setSelected] = useState<Activity[]>(draft.activities);

  const toggle = (a: Activity) =>
    setSelected((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  return (
    <OnboardingShell
      step={3}
      total={6}
      eyebrow="Step 3 of 6"
      title={
        <>
          How do you <Text style={{ color: colors.accent, fontStyle: 'italic' }}>move</Text>?
        </>
      }
      subtitle="Pick everything that's true. Kai will tune advice to whichever you do most."
      primaryDisabled={selected.length === 0}
      onPrimary={() => {
        draft.set({ activities: selected });
        router.push('/(onboarding)/goal');
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ALL.map(({ value, label, Icon }) => (
          <Chip
            key={value}
            label={label}
            selected={selected.includes(value)}
            onPress={() => toggle(value)}
            icon={
              <Icon
                size={16}
                color={selected.includes(value) ? colors.textInv : colors.text}
                strokeWidth={2}
              />
            }
          />
        ))}
      </View>
      <Text
        style={{
          color: colors.text3,
          fontSize: 13,
          marginTop: 16,
        }}
      >
        Selected: {selected.length}
      </Text>
    </OnboardingShell>
  );
}
