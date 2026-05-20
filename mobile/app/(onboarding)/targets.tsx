import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { calculateTargets, type OnboardingInput } from '@plate/shared';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { colors, radius, type } from '../../lib/theme';

function MacroCard({
  label,
  value,
  unit,
  tint,
}: {
  label: string;
  value: number;
  unit: string;
  tint: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tint }} />
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
        <Text style={{ ...type.display3, fontSize: 28, color: colors.text }}>{value}</Text>
        <Text style={{ ...type.bodySm, color: colors.text3, marginLeft: 4 }}>{unit}</Text>
      </View>
    </View>
  );
}

export default function TargetsScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const refreshMe = useAuth((s) => s.refreshMe);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const targets = useMemo(() => {
    // birthdate is optional — calculateTargets defaults the age when absent.
    if (
      !draft.sex ||
      !draft.heightCm ||
      !draft.weightKg ||
      !draft.goal ||
      draft.goalRateKgPerWeek === undefined
    )
      return null;
    return calculateTargets({
      sex: draft.sex,
      birthdate: draft.birthdate,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      activities: draft.activities,
      goal: draft.goal,
      goalRateKgPerWeek: draft.goalRateKgPerWeek,
    });
  }, [draft]);

  if (!targets) {
    return (
      <OnboardingShell
        step={6}
        total={6}
        title={<>Missing info.</>}
        subtitle="Go back and complete the previous steps."
        onPrimary={() => router.replace('/(onboarding)/welcome')}
        primaryLabel="Start over"
      >
        <View />
      </OnboardingShell>
    );
  }

  const submit = async () => {
    if (
      !draft.sex ||
      !draft.heightCm ||
      !draft.weightKg ||
      !draft.goal ||
      draft.goalRateKgPerWeek === undefined
    )
      return;
    setSubmitting(true);
    setErr(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const payload: OnboardingInput = {
        sex: draft.sex,
        birthdate: draft.birthdate,
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        activities: draft.activities,
        goal: draft.goal,
        goalRateKgPerWeek: draft.goalRateKgPerWeek,
        units: draft.units,
        timezone: tz,
      };
      await api.post('/v1/me/onboarding', payload);
      await refreshMe();
      router.replace('/(tabs)');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save your profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      step={6}
      total={6}
      eyebrow="Step 6 of 6"
      title={
        <>
          Your daily <Text style={{ color: colors.accent, fontStyle: 'italic' }}>targets</Text>.
        </>
      }
      subtitle="Showing the math. You can adjust any of these later in Settings."
      primaryLabel="Save and continue"
      primaryLoading={submitting}
      onPrimary={() => void submit()}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
        }}
      >
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Calories per day
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
          <Text style={{ ...type.display1, color: colors.text }}>{targets.dailyKcal}</Text>
          <Text style={{ ...type.body, color: colors.text3, marginLeft: 8 }}>kcal</Text>
        </View>
        <Text style={{ ...type.bodySm, color: colors.text3, marginTop: 6 }}>
          TDEE estimate: {targets.tdee} kcal
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <MacroCard label="Protein" value={targets.dailyProteinG} unit="g" tint={colors.protein} />
        <MacroCard label="Carbs" value={targets.dailyCarbsG} unit="g" tint={colors.carbs} />
        <MacroCard label="Fat" value={targets.dailyFatG} unit="g" tint={colors.fat} />
      </View>

      {err ? (
        <Text style={{ ...type.bodySm, color: colors.danger, marginTop: 16 }}>{err}</Text>
      ) : null}
    </OnboardingShell>
  );
}
