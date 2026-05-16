import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera as CameraIcon, RotateCcw, X } from 'lucide-react-native';
import type { ScanRequest, ScanResponse, ScanResult } from '@plate/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { ProcessingOverlay } from '../../components/scan/ProcessingOverlay';
import { api, ApiError } from '../../lib/api';
import { useLogFood } from '../../hooks/useDailyLogs';
import { toIsoDate } from '../../lib/formatters';
import { colors, radius, type } from '../../lib/theme';
import type { MealType } from '@plate/shared';

type Phase = 'preview' | 'scanning' | 'result';

const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function pickDefaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

export default function ScanTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [phase, setPhase] = useState<Phase>('preview');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isoDate = toIsoDate(new Date());
  const logFood = useLogFood(isoDate);

  const reset = useCallback(() => {
    setPhase('preview');
    setPhotoUri(null);
    setScan(null);
    setImageUrl(null);
    setError(null);
  }, []);

  const capture = useCallback(async () => {
    if (!cameraRef.current) return;
    setError(null);
    try {
      setPhase('scanning');
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (!shot?.uri) throw new Error('No image captured');
      setPhotoUri(shot.uri);

      // Resize to max 1024px on the long edge, compress to ~0.6 JPEG.
      const processed = await ImageManipulator.manipulateAsync(
        shot.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!processed.base64) throw new Error('Image processing failed');

      const body: ScanRequest = {
        imageBase64: processed.base64,
        contentType: 'image/jpeg',
      };
      const resp = await api.post<ScanResponse>('/v1/food/scan', body);
      setScan(resp.result);
      setImageUrl(resp.imageUrl);
      setPhase('result');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not analyze the photo.';
      setError(msg);
      setPhase('preview');
    }
  }, []);

  // -------------------- Permission gate --------------------
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <CameraIcon color={colors.accent} size={32} strokeWidth={1.6} />
        <Text style={[type.display2, { color: colors.text, marginTop: 18 }]}>
          Point. <Text style={{ color: colors.accent, fontStyle: 'italic' }}>Done</Text>.
        </Text>
        <Text style={[type.bodyLg, { color: colors.text2, marginTop: 12, maxWidth: 320 }]}>
          Plate uses your camera to estimate what you&apos;re eating in three seconds.
        </Text>
        <View style={{ marginTop: 28 }}>
          <Button label="Allow camera" size="lg" onPress={() => void requestPermission()} />
        </View>
      </View>
    );
  }

  // -------------------- Scanning --------------------
  if (phase === 'scanning') {
    return <ProcessingOverlay photoUri={photoUri} />;
  }

  // -------------------- Result --------------------
  if (phase === 'result' && scan) {
    return (
      <ResultView
        scan={scan}
        photoUri={photoUri}
        imageUrl={imageUrl}
        insets={insets}
        onRetry={reset}
        onLogged={() => {
          reset();
          router.push('/(tabs)');
        }}
        logging={logFood.isPending}
        logFood={(payload) => logFood.mutateAsync(payload)}
      />
    );
  }

  // -------------------- Preview + capture --------------------
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      {/* Top bar */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            ...type.monoSm,
            color: '#fff',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowRadius: 4,
          }}
        >
          Plate scan
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)')}
          hitSlop={10}
          accessibilityLabel="Close scan"
        >
          <X color="#fff" size={26} />
        </Pressable>
      </View>

      {/* Framing hint */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 260,
            height: 260,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: 'rgba(220,255,79,0.6)',
          }}
        />
      </View>

      {/* Error banner */}
      {error ? (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 56,
            left: 20,
            right: 20,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: 'rgba(255,90,90,0.16)',
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Text style={[type.bodySm, { color: '#fff' }]}>{error}</Text>
        </View>
      ) : null}

      {/* Bottom controls */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + 24,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            ...type.bodySm,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 14,
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowRadius: 4,
          }}
        >
          Center the food in the box · tap to scan
        </Text>
        <Pressable
          onPress={() => void capture()}
          accessibilityRole="button"
          accessibilityLabel="Capture food"
          style={({ pressed }) => ({
            width: 84,
            height: 84,
            borderRadius: 42,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.85)',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CameraIcon size={26} color={colors.textInv} strokeWidth={2.2} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// -------------------- Result subcomponent --------------------

interface ResultViewProps {
  scan: ScanResult;
  photoUri: string | null;
  imageUrl: string | null;
  insets: { top: number; bottom: number };
  onRetry: () => void;
  onLogged: () => void;
  logging: boolean;
  logFood: (payload: {
    name?: string;
    grams: number;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    mealType: MealType;
    loggedAt: string;
    source: 'scan';
    scanImageUrl?: string;
  }) => Promise<unknown>;
}

function ResultView({
  scan,
  photoUri,
  imageUrl,
  insets,
  onRetry,
  onLogged,
  logging,
  logFood,
}: ResultViewProps) {
  const [name, setName] = useState(scan.foodName);
  const [grams, setGrams] = useState(String(Math.round(scan.portionGrams)));
  const [kcal, setKcal] = useState(String(Math.round(scan.kcal)));
  const [proteinG, setProteinG] = useState(String(Math.round(scan.proteinG)));
  const [carbsG, setCarbsG] = useState(String(Math.round(scan.carbsG)));
  const [fatG, setFatG] = useState(String(Math.round(scan.fatG)));
  const [meal, setMeal] = useState<MealType>(pickDefaultMeal());

  const lowConfidence = scan.confidence < 0.4;
  const confidencePct = Math.round(scan.confidence * 100);

  const valid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      Number(grams) > 0 &&
      Number(kcal) >= 0 &&
      Number(proteinG) >= 0 &&
      Number(carbsG) >= 0 &&
      Number(fatG) >= 0
    );
  }, [name, grams, kcal, proteinG, carbsG, fatG]);

  const onLog = async () => {
    try {
      await logFood({
        name: name.trim(),
        grams: Number(grams),
        kcal: Number(kcal),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatG: Number(fatG),
        mealType: meal,
        loggedAt: new Date().toISOString(),
        source: 'scan',
        ...(imageUrl ? { scanImageUrl: imageUrl } : {}),
      });
      onLogged();
    } catch (e) {
      Alert.alert('Could not log', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 110,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {photoUri ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Image
              source={{ uri: photoUri }}
              style={{
                width: '100%',
                height: 220,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
              }}
              resizeMode="cover"
              accessibilityLabel="Captured food"
            />
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              ...type.monoSm,
              color: colors.text3,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            Estimate · {confidencePct}% confidence
          </Text>
          <Pressable
            onPress={onRetry}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            accessibilityLabel="Retake photo"
          >
            <RotateCcw size={14} color={colors.text2} />
            <Text style={[type.label, { color: colors.text2 }]}>Retake</Text>
          </Pressable>
        </View>

        {lowConfidence ? (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 10,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.borderHi,
            }}
          >
            <Text style={[type.bodySm, { color: colors.text }]}>
              I&apos;m not very sure about this one. Double-check the numbers below before logging.
            </Text>
            {scan.notes ? (
              <Text style={[type.bodySm, { color: colors.text3, marginTop: 4 }]}>{scan.notes}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, marginTop: 18, gap: 14 }}>
          <Input label="Food" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Grams"
                value={grams}
                onChangeText={setGrams}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Calories"
                value={kcal}
                onChangeText={setKcal}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Protein (g)"
                value={proteinG}
                onChangeText={setProteinG}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Carbs (g)"
                value={carbsG}
                onChangeText={setCarbsG}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Fat (g)"
                value={fatG}
                onChangeText={setFatG}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <Text
              style={{
                ...type.monoSm,
                color: colors.text3,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Meal
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MEALS.map((m) => (
                <Chip
                  key={m.value}
                  label={m.label}
                  selected={meal === m.value}
                  onPress={() => setMeal(m.value)}
                />
              ))}
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
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button
          label="Log it"
          size="lg"
          onPress={() => void onLog()}
          disabled={!valid}
          loading={logging}
        />
      </View>
    </View>
  );
}
