import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X as XIcon } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from './ui/Button';
import { fetchProOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';
import { useAuth } from '../stores/auth';
import { useUpgradeModal, type UpgradeReason } from '../stores/upgradeModal';
import { colors, radius, type } from '../lib/theme';

const PRO_BENEFITS = [
  { title: '30 AI food scans / day', sub: 'vs. 3 on free' },
  { title: '20 AI recipes / day', sub: 'vs. 1 on free' },
  { title: '50 coach messages / day', sub: 'vs. 10 on free' },
  { title: 'Full lifetime stats', sub: 'vs. 30 days on free' },
  { title: 'Unlimited pantry & data export', sub: '' },
];

// Reason-specific eyebrow + headline. Body/plans/CTA are shared across reasons
// so the modal still feels like one consistent surface.
function copyFor(reason: UpgradeReason): { eyebrow: string; headline: React.ReactNode } {
  const accent = (s: string) => (
    <Text style={{ color: colors.accent, fontStyle: 'italic' }}>{s}</Text>
  );
  switch (reason) {
    case 'recipe-cap':
      return {
        eyebrow: "That's your free recipe today",
        headline: (
          <>
            Want {accent('more')}?{'\n'}Cap less.
          </>
        ),
      };
    case 'scan-cap':
      return {
        eyebrow: 'Out of free scans today',
        headline: (
          <>
            Scan {accent('more')}.{'\n'}Cap less.
          </>
        ),
      };
    case 'coach-cap':
      return {
        eyebrow: "You've maxed out Kai today",
        headline: (
          <>
            Chat {accent('more')}.{'\n'}Cap less.
          </>
        ),
      };
    case 'first-recipe-of-day':
      return {
        eyebrow: 'Nice recipe',
        headline: (
          <>
            Make {accent('more')}.{'\n'}Cap less.
          </>
        ),
      };
    case 'manual':
    default:
      return {
        eyebrow: 'Plate Pro',
        headline: (
          <>
            Eat {accent('more')}.{'\n'}Cap less.
          </>
        ),
      };
  }
}

export function UpgradeModal() {
  const visible = useUpgradeModal((s) => s.visible);
  const reason = useUpgradeModal((s) => s.reason);
  const hide = useUpgradeModal((s) => s.hide);
  const refreshMe = useAuth((s) => s.refreshMe);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  // Fetch offerings only once it's actually opened — the first paint should
  // be free for users who never open this. Re-fetch on each open so a network
  // hiccup doesn't poison the cached state forever.
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setUnavailable(false);
    setDebugError(null);
    void (async () => {
      const offerings = await fetchProOfferings();
      if (!offerings.monthly && !offerings.annual) {
        setUnavailable(true);
        if (offerings.error) setDebugError(offerings.error);
      } else {
        setMonthly(offerings.monthly);
        setAnnual(offerings.annual);
        if (!offerings.annual) setSelected('monthly');
        else setSelected('annual');
      }
      setLoading(false);
    })();
  }, [visible]);

  const onPurchase = async () => {
    const pkg = selected === 'annual' ? annual : monthly;
    if (!pkg) return;
    setBusy('purchase');
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) {
        await refreshMe();
        hide();
      } else {
        Alert.alert('Purchase incomplete', 'No active subscription was granted.');
      }
    } catch (e) {
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
          { text: 'Great', onPress: () => hide() },
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
  const copy = copyFor(reason);

  return (
    <Modal
      visible={visible}
      onRequestClose={hide}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 14,
            paddingHorizontal: 22,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={hide}
            accessibilityLabel="Close"
            hitSlop={10}
            style={{ alignSelf: 'flex-start', padding: 4 }}
          >
            <XIcon size={26} color={colors.text2} strokeWidth={2} />
          </Pressable>

          <Text
            style={{
              ...type.monoSm,
              color: colors.text3,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              marginTop: 18,
            }}
          >
            {copy.eyebrow}
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
            {copy.headline}
          </Text>
          <Text style={[type.bodyLg, { color: colors.text2, marginTop: 12, maxWidth: 320 }]}>
            More AI, more recipes, full history. Cancel anytime.
          </Text>

          <View style={{ marginTop: 28, gap: 12 }}>
            {PRO_BENEFITS.map((b) => (
              <View
                key={b.title}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
              >
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
                    <Text style={[type.bodySm, { color: colors.text3, marginTop: 2 }]}>
                      {b.sub}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

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
              {debugError ? (
                <Text
                  style={{
                    ...type.bodySm,
                    color: colors.text3,
                    textAlign: 'left',
                    marginTop: 14,
                    fontFamily: 'Menlo',
                    fontSize: 11,
                    lineHeight: 15,
                  }}
                  selectable
                >
                  {'DEBUG: '}
                  {debugError}
                </Text>
              ) : null}
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
              label={
                pkg ? `Start with ${selected === 'annual' ? 'annual' : 'monthly'}` : 'Continue'
              }
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
            {/* Apple guideline 3.1.2 requires Terms + Privacy links in the
                subscription purchase flow itself, not just store metadata. */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
              }}
            >
              <Pressable
                onPress={() => void WebBrowser.openBrowserAsync('https://plate.best/terms')}
                hitSlop={8}
                accessibilityLabel="Terms of Use"
              >
                <Text
                  style={{
                    ...type.bodySm,
                    color: colors.text3,
                    fontSize: 11,
                    textDecorationLine: 'underline',
                  }}
                >
                  Terms of Use
                </Text>
              </Pressable>
              <Text style={{ ...type.bodySm, color: colors.text3, fontSize: 11 }}>·</Text>
              <Pressable
                onPress={() => void WebBrowser.openBrowserAsync('https://plate.best/privacy')}
                hitSlop={8}
                accessibilityLabel="Privacy Policy"
              >
                <Text
                  style={{
                    ...type.bodySm,
                    color: colors.text3,
                    fontSize: 11,
                    textDecorationLine: 'underline',
                  }}
                >
                  Privacy Policy
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
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
  const price = annual.product.price;
  if (!price) return annual.product.priceString;
  const monthly = (price / 12).toFixed(2);
  const currency = annual.product.currencyCode ?? 'USD';
  if (currency === 'USD') return `$${monthly}`;
  return `${monthly} ${currency}`;
}
