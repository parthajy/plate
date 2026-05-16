import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, Text, useColorScheme, View } from 'react-native';
import { useSettings } from '../../stores/settings';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Sex } from '@plate/shared';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboarding } from '../../stores/onboarding';
import { colors, radius, type } from '../../lib/theme';

const OPTIONS: { value: Sex; label: string }[] = [
  { value: 'm', label: 'Male' },
  { value: 'f', label: 'Female' },
  { value: 'x', label: 'Other' },
];

const DEFAULT_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 28);
  return d;
})();

const MIN_DOB = new Date(1920, 0, 1);
const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d;
})();

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDob(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SexScreen() {
  const router = useRouter();
  const draft = useOnboarding();
  const [sex, setSex] = useState<Sex | undefined>(draft.sex);
  const [dob, setDob] = useState<Date | null>(draft.birthdate ? new Date(draft.birthdate) : null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Spinner picker needs the right themeVariant or its text disappears
  // (dark text on dark bg in light mode, light on light in dark mode).
  const sysScheme = useColorScheme();
  const themeMode = useSettings((s) => s.themeMode);
  const effectiveMode: 'light' | 'dark' =
    themeMode === 'light'
      ? 'light'
      : themeMode === 'dark'
        ? 'dark'
        : sysScheme === 'light'
          ? 'light'
          : 'dark';

  const valid = !!sex && !!dob;

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
        if (!sex || !dob) return;
        draft.set({ sex, birthdate: toIsoDate(dob) });
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

      <View style={{ marginTop: 28 }}>
        <Text
          style={{
            ...type.label,
            color: colors.text2,
            marginBottom: 8,
          }}
        >
          Date of birth
        </Text>

        <Pressable
          onPress={() => setPickerOpen((v) => !v)}
          style={{
            height: 56,
            borderRadius: radius.lg,
            paddingHorizontal: 16,
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: pickerOpen ? colors.borderHi : colors.border,
          }}
          accessibilityRole="button"
          accessibilityLabel="Pick date of birth"
        >
          <Text
            style={{
              ...type.body,
              color: dob ? colors.text : colors.text3,
            }}
          >
            {dob ? fmtDob(dob) : 'Tap to pick'}
          </Text>
        </Pressable>

        <Text
          style={{
            ...type.bodySm,
            color: colors.text3,
            marginTop: 8,
          }}
        >
          Used only for age in the BMR calculation.
        </Text>

        {pickerOpen && Platform.OS === 'ios' ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <DateTimePicker
              value={dob ?? DEFAULT_DOB}
              mode="date"
              display="spinner"
              themeVariant={effectiveMode}
              textColor={colors.text}
              minimumDate={MIN_DOB}
              maximumDate={MAX_DOB}
              onChange={(_, picked) => {
                if (picked) setDob(picked);
              }}
              style={{ backgroundColor: colors.surface }}
            />
          </View>
        ) : null}

        {pickerOpen && Platform.OS === 'android' ? (
          <DateTimePicker
            value={dob ?? DEFAULT_DOB}
            mode="date"
            display="calendar"
            minimumDate={MIN_DOB}
            maximumDate={MAX_DOB}
            onChange={(event, picked) => {
              setPickerOpen(false);
              if (event.type === 'set' && picked) setDob(picked);
            }}
          />
        ) : null}
      </View>
    </OnboardingShell>
  );
}
