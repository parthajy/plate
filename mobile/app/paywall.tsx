import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X as XIcon } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../components/ui/Button';
import { fetchProOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';
import { useAuth } from '../stores/auth';
import { colors, radius, type } from '../lib/theme';

// What the paywall actually promises. Order matches dollar weight: most
// expensive (AI per-call cost) first.
const PRO_BENEFITS = [
  { title: '30 AI food scans / day', sub: 'vs. 3 on free' },
  { title: '20 AI recipes / day', sub: 'vs. 1 on free' },
  { title: '50 coach messages / day', sub: 'vs. 10 on free' },
  { title: 'Full lifetime stats', sub: 'vs. 30 days on free' },
  { title: 'Unlimited pantry & data export', sub: '' },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const refreshMe = useAuth((s) => s.refreshMe);

  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    void (async () => {
      const offerings = await fetchProOfferings();
      if (!offerings || (!offerings.monthly && !offerings.annual)) {
        setUnavailable(true);
      } else {
        setMonthly(offerings.monthly);
        setAnnual(offerings.annual);
        if (!offerings.annual) setSelected('monthly');
      }
      setLoading(false);
    })();
  }, []);

  const onPurchase = async () => {
    const pkg = selected === 'annual' ? annual : monthly;
    if (!pkg) return;
    setBusy('purchase');
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) {
        await refreshMe(); // sync server-side subscription state
        router.back();
      } else {
        Alert.alert('Purchase incomplete', 'No active subscription was granted.');
      }
    } catch (e) {
      // RC throws with `userCancelled: true` on cancellation — don't alert
      // in that case, the user knows they cancelled.
      const userCancelled =
        e &&
        typeof e === 'object' &&
        'userCancelled' in e &&
        (e as { userCancelled: boolean }).userCancelled;
      if (!userCancelled) {
        Alert.alert(
          'Purchase failed',
          e instanceof Error ? e.message : 'Something went wrong. Try again.',
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        await refreshMe();
        Alert.alert('Restored', 'Your Pro subscription is active again.', [
          { text: 'Great', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Nothing to restore', 'No previous Pro purchase found on this Apple ID.');
      }
    } catch (e) {
      Alert.alert(
        'Restore failed',
        e instanceof Error ? e.message : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const pkg = selected === 'annual' ? annual : monthly;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          hitSlop={10}
          style={{ alignSelf: 'flex-start', padding: 4 }}
        >
          <XIcon size={26} color={colors.text2} strokeWidth={2} />
        </Pressable>

        {/* Hero */}
        <Text
          style={{
            ...type.monoSm,
            color: colors.text3,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            marginTop: 18,
          }}
        >
          Plate Pro
        </Text>
        <Text
          style={{
            ...type.display1,
            color: colors.text,
            marginTop: 8,
            fontSize: 44,
            lineHeight: 46,
            letterSpacing: -1.2,
          }}
        >
          Eat <Text style={{ color: colors.accent, fontStyle: 'italic' }}>more</Text>.{'\n'}
          Cap less.
        </Text>
        <Text style={[type.bodyLg, { color: colors.text2, marginTop: 12, maxWidth: 320 }]}>
          More AI, more recipes, full history. Cancel anytime.
        </Text>

        {/* Benefits */}
        <View style={{ marginTop: 28, gap: 12 }}>
          {PRO_BENEFITS.map((b) => (
            <View key={b.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Check size={14} color={colors.textInv} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodyLg, { color: colors.text, fontWeight: '500' }]}>
                  {b.title}
                </Text>
                {b.sub ? (
                  <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>{b.sub}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Plan picker */}
        {loading ? (
          <View style={{ marginTop: 36, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : unavailable ? (
          <View
            style={{
              marginTop: 36,
              padding: 16,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={[type.body, { color: colors.text2, textAlign: 'center' }]}>
              Subscriptions aren't available right now. We're setting them up — check back soon.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 32, gap: 12 }}>
            {annual ? (
              <PlanCard
                label="Annual"
                price={annual.product.priceString}
                cadence="/ year"
                tagline={priceMonthlyEquivalent(annual) + ' / mo · save ~42%'}
                selected={selected === 'annual'}
                onPress={() => setSelected('annual')}
                badge="Best value"
              />
            ) : null}
            {monthly ? (
              <PlanCard
                label="Monthly"
                price={monthly.product.priceString}
                cadence="/ month"
                tagline="Cancel anytime"
                selected={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      {!unavailable && (monthly || annual) ? (
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: insets.bottom + 14,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button
            label={pkg ? `Start with ${selected === 'annual' ? 'annual' : 'monthly'}` : 'Continue'}
            size="lg"
            onPress={() => void onPurchase()}
            loading={busy === 'purchase'}
            disabled={!pkg || busy !== null}
          />
          <Pressable
            onPress={() => void onRestore()}
            disabled={busy !== null}
            hitSlop={8}
            style={{ marginTop: 10, padding: 8, alignSelf: 'center' }}
            accessibilityLabel="Restore purchases"
          >
            <Text
              style={{
                ...type.bodySm,
                color: colors.text3,
                textDecorationLine: 'underline',
              }}
            >
              {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </Pressable>
          <Text
            style={{
              ...type.bodySm,
              color: colors.text3,
              textAlign: 'center',
              marginTop: 8,
              fontSize: 11,
              lineHeight: 16,
            }}
          >
            Auto-renews. Cancel anytime in App Store settings.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PlanCard({
  label,
  price,
  cadence,
  tagline,
  selected,
  onPress,
  badge,
}: {
  label: string;
  price: string;
  cadence: string;
  tagline: string;
  selected: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          padding: 16,
          borderRadius: radius.xl,
          backgroundColor: selected ? colors.surface : 'transparent',
          borderWidth: 2,
          borderColor: selected ? colors.accent : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[type.bodyLg, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
          {badge ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: colors.accent,
              }}
            >
              <Text
                style={{
                  ...type.monoSm,
                  color: colors.textInv,
                  fontWeight: '700',
                  letterSpacing: 1,
                }}
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 4 }}>
          <Text
            style={{
              fontFamily: 'Fraunces_400Regular',
              fontSize: 28,
              color: colors.text,
              letterSpacing: -0.5,
            }}
          >
            {price}
          </Text>
          <Text style={[type.bodySm, { color: colors.text3 }]}>{cadence}</Text>
        </View>
        <Text style={[type.bodySm, { color: colors.text3, marginTop: 4 }]}>{tagline}</Text>
      </View>
    </Pressable>
  );
}

function priceMonthlyEquivalent(annual: PurchasesPackage): string {
  // Best-effort estimate from priceString. RC's product.price is a number
  // in the user's currency but priceString includes formatting. If we can
  // pull a number out, divide by 12; otherwise just show the annual price.
  const price = annual.product.price;
  if (!price) return annual.product.priceString;
  const monthly = (price / 12).toFixed(2);
  const currency = annual.product.currencyCode ?? 'USD';
  // Approximate format — good enough for "~$5.83/mo" tagline.
  if (currency === 'USD') return `$${monthly}`;
  return `${monthly} ${currency}`;
}
