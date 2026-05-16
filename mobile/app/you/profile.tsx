import { useState } from 'react';
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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../stores/auth';
import { ApiError } from '../../lib/api';
import { colors, type } from '../../lib/theme';

export default function ProfileEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [heightCm, setHeightCm] = useState(String(user?.heightCm ?? ''));
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? '');
  const [saving, setSaving] = useState(false);

  const h = Number(heightCm);
  const w = Number(weightKg);
  const valid =
    displayName.trim().length >= 1 &&
    displayName.trim().length <= 64 &&
    h >= 80 &&
    h <= 260 &&
    w >= 25 &&
    w <= 400;

  const onSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        heightCm: h,
        weightKg: w,
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
          Edit profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[type.display2, { color: colors.text, marginTop: 4 }]}>
          Body &amp; <Text style={{ color: colors.accent, fontStyle: 'italic' }}>name</Text>.
        </Text>
        <Text style={[type.body, { color: colors.text3, marginTop: 8 }]}>
          Changes to height or weight will recompute your daily targets.
        </Text>

        <View style={{ gap: 14, marginTop: 24 }}>
          <Input
            label="Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="What should we call you?"
            autoCapitalize="words"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="number-pad"
                placeholder="178"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="74"
              />
            </View>
          </View>
        </View>
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
          label="Save"
          size="lg"
          disabled={!valid}
          loading={saving}
          onPress={() => void onSave()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
