import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bike,
  Dumbbell,
  Footprints,
  Heart,
  MoreHorizontal,
  Trash2,
  Waves,
} from 'lucide-react-native';
import type { WorkoutType } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { DateScrubber } from '../../components/today/DateScrubber';
import { useDeleteWorkout, useLogWorkout, useWorkouts } from '../../hooks/useWorkouts';
import { ApiError } from '../../lib/api';
import { fmtDateStamp, toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';

interface TypeOpt {
  value: WorkoutType;
  label: string;
  icon: (size: number, color: string) => React.ReactNode;
}

const TYPES: TypeOpt[] = [
  { value: 'gym', label: 'Gym', icon: (s, c) => <Dumbbell size={s} color={c} strokeWidth={2} /> },
  { value: 'run', label: 'Run', icon: (s, c) => <Footprints size={s} color={c} strokeWidth={2} /> },
  { value: 'cycle', label: 'Cycle', icon: (s, c) => <Bike size={s} color={c} strokeWidth={2} /> },
  { value: 'swim', label: 'Swim', icon: (s, c) => <Waves size={s} color={c} strokeWidth={2} /> },
  {
    value: 'sports',
    label: 'Sports',
    icon: (s, c) => <Heart size={s} color={c} strokeWidth={2} />,
  },
  { value: 'yoga', label: 'Yoga', icon: (s, c) => <Heart size={s} color={c} strokeWidth={2} /> },
  {
    value: 'walk',
    label: 'Walk',
    icon: (s, c) => <Footprints size={s} color={c} strokeWidth={2} />,
  },
  {
    value: 'other',
    label: 'Other',
    icon: (s, c) => <MoreHorizontal size={s} color={c} strokeWidth={2} />,
  },
];

const DURATIONS = [15, 30, 45, 60, 90];

const TYPE_LABELS: Record<WorkoutType, string> = Object.fromEntries(
  TYPES.map((t) => [t.value, t.label]),
) as Record<WorkoutType, string>;

const TYPE_ICONS: Record<WorkoutType, (size: number, color: string) => React.ReactNode> =
  Object.fromEntries(TYPES.map((t) => [t.value, t.icon])) as Record<
    WorkoutType,
    (size: number, color: string) => React.ReactNode
  >;

export default function WorkoutsTab() {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const isoDate = toIsoDate(date);

  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useWorkouts(isoDate);
  const logWorkout = useLogWorkout(isoDate);
  const deleteWorkout = useDeleteWorkout(isoDate);

  const effectiveDuration = durationMin ?? (customDuration ? Number(customDuration) : 0);
  const canSave = !!workoutType && effectiveDuration > 0 && effectiveDuration <= 600;

  const onSave = useCallback(async () => {
    if (!workoutType) return;
    try {
      await logWorkout.mutateAsync({
        type: workoutType,
        durationMin: effectiveDuration,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        source: 'manual',
      });
      setWorkoutType(null);
      setDurationMin(null);
      setCustomDuration('');
      setNotes('');
    } catch (e) {
      Alert.alert('Could not log', e instanceof ApiError ? e.message : 'Try again.');
    }
  }, [type, effectiveDuration, notes, logWorkout]);

  const workouts = data?.workouts ?? [];
  const totals = data?.totals ?? { durationMin: 0, kcalBurned: 0 };

  const onDelete = (id: string) => {
    Alert.alert('Delete workout?', 'This removes it from your log.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorkout.mutate(id),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {fmtDateStamp(date)}
        </Text>
        <Text style={[type.display2, { color: colors.text, marginTop: 6 }]}>
          Train <Text style={{ color: colors.accent, fontStyle: 'italic' }}>hard</Text>.
        </Text>

        <View style={{ marginTop: 4, marginBottom: 14 }}>
          <DateScrubber date={date} onChange={setDate} />
        </View>

        {/* Totals card */}
        <View
          style={{
            padding: 16,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={[type.monoSm, { color: colors.text3, letterSpacing: 1.2 }]}>MOVEMENT</Text>
            <Text style={[type.display3, { color: colors.text, marginTop: 4 }]}>
              {totals.durationMin}
              <Text style={{ ...type.body, color: colors.text3 }}> min</Text>
            </Text>
          </View>
          <View>
            <Text style={[type.monoSm, { color: colors.text3, letterSpacing: 1.2 }]}>
              CALORIES OUT
            </Text>
            <Text style={[type.display3, { color: colors.text, marginTop: 4 }]}>
              {totals.kcalBurned}
              <Text style={{ ...type.body, color: colors.text3 }}> kcal</Text>
            </Text>
          </View>
        </View>

        {/* Quick log */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Log a workout
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TYPES.map((opt) => {
            const selected = workoutType === opt.value;
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={selected}
                onPress={() => setWorkoutType(opt.value)}
                icon={opt.icon(14, selected ? colors.textInv : colors.text2)}
              />
            );
          })}
        </View>

        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 18,
            marginBottom: 10,
          }}
        >
          Duration
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} min`}
              selected={durationMin === d}
              onPress={() => {
                setDurationMin(d);
                setCustomDuration('');
              }}
            />
          ))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface2,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: customDuration ? colors.borderHi : colors.border,
              paddingHorizontal: 12,
              height: 38,
              minWidth: 96,
            }}
          >
            <TextInput
              value={customDuration}
              onChangeText={(v) => {
                setCustomDuration(v.replace(/[^0-9]/g, ''));
                setDurationMin(null);
              }}
              keyboardType="number-pad"
              placeholder="Other"
              placeholderTextColor={colors.text3}
              style={{ ...type.bodySm, color: colors.text, flex: 1, padding: 0 }}
              maxLength={3}
            />
            <Text style={[type.bodySm, { color: colors.text3 }]}>min</Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.surface2,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional) — e.g. push day, easy 5k"
            placeholderTextColor={colors.text3}
            style={{ ...type.body, color: colors.text, minHeight: 22 }}
            multiline
            maxLength={500}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <Button
            label="Log workout"
            size="lg"
            disabled={!canSave}
            loading={logWorkout.isPending}
            onPress={() => void onSave()}
          />
        </View>

        {/* List */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginTop: 32,
            marginBottom: 10,
          }}
        >
          Logged
        </Text>
        {isLoading ? null : workouts.length === 0 ? (
          <View
            style={{
              padding: 18,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
            }}
          >
            <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
              No workouts on this day.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {workouts.map((w) => {
              const iconFn = TYPE_ICONS[w.type];
              return (
                <Pressable
                  key={w.id}
                  onLongPress={() => onDelete(w.id)}
                  delayLongPress={400}
                  accessibilityLabel={`${TYPE_LABELS[w.type]}, ${w.durationMin} minutes`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: colors.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {iconFn(18, colors.accent)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, { color: colors.text }]}>
                      {TYPE_LABELS[w.type]} · {w.durationMin} min
                    </Text>
                    {w.notes ? (
                      <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>
                        {w.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[type.label, { color: colors.text2 }]}>{w.kcalBurned} kcal</Text>
                  <Pressable
                    onPress={() => onDelete(w.id)}
                    hitSlop={10}
                    style={{ marginLeft: 10 }}
                    accessibilityLabel="Delete workout"
                  >
                    <Trash2 size={16} color={colors.text3} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
